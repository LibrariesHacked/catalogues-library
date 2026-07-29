/**
 * Centralized agent management for handling anti-bot measures
 * Provides agent pooling, User-Agent rotation, retry logic, and request throttling
 */

import request from 'superagent'
import UserAgent from 'user-agents'
import { limiter } from './request-limiter.js'

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 30000,
  BACKOFF_MULTIPLIER: 2,
  RETRY_STATUS_CODES: [429, 502, 503, 504]
}

class AgentPool {
  constructor (serviceKey, poolSize = 3) {
    this.serviceKey = serviceKey
    this.poolSize = poolSize
    this.agents = []
    this.userAgents = []
    this.lastAgentIndex = 0
    this.lastUserAgentIndex = 0
    this.circuitBreakerOpen = false
    this.circuitBreakerResetTime = null
    this.failureCount = 0
    this.circuitBreakerThreshold = 5
    this.circuitBreakerTimeout = 5 * 60 * 1000 // 5 minutes

    this.initializeAgents()
  }

  initializeAgents () {
    // Create pool of agents with different user agents
    for (let i = 0; i < this.poolSize; i++) {
      this.agents.push(request.agent())
      // Use a variety of user agents to avoid detection
      this.userAgents.push(
        new UserAgent({ deviceCategory: 'desktop' }).toString(),
        new UserAgent({ deviceCategory: 'mobile' }).toString(),
        new UserAgent({ deviceCategory: 'tablet' }).toString()
      )
    }
  }

  /**
   * Get next agent in rotation
   */
  getNextAgent () {
    const agent = this.agents[this.lastAgentIndex % this.poolSize]
    this.lastAgentIndex++
    return agent
  }

  /**
   * Get next user agent in rotation
   */
  getNextUserAgent () {
    const ua = this.userAgents[this.lastUserAgentIndex % this.userAgents.length]
    this.lastUserAgentIndex++
    return ua
  }

  /**
   * Check circuit breaker status
   */
  isOpen () {
    if (!this.circuitBreakerOpen) return false

    const now = Date.now()
    if (now > this.circuitBreakerResetTime) {
      this.circuitBreakerOpen = false
      this.failureCount = 0
      return false
    }
    return true
  }

  /**
   * Record failure and potentially open circuit
   */
  recordFailure () {
    this.failureCount++
    if (this.failureCount >= this.circuitBreakerThreshold) {
      this.circuitBreakerOpen = true
      this.circuitBreakerResetTime = Date.now() + this.circuitBreakerTimeout
    }
  }

  /**
   * Record success and reset circuit
   */
  recordSuccess () {
    this.failureCount = 0
  }
}

/**
 * AgentManager maintains agent pools per service and handles request orchestration
 */
export class AgentManager {
  constructor () {
    this.pools = new Map()
    this.sessionAgents = new Map() // Maps sessionId to agent instance for session persistence
  }

  /**
   * Get agent pool for a service
   */
  getPool (serviceKey) {
    if (!this.pools.has(serviceKey)) {
      this.pools.set(serviceKey, new AgentPool(serviceKey))
    }
    return this.pools.get(serviceKey)
  }

  /**
   * Get a fresh agent from the pool with rotated User-Agent
   */
  getAgent (serviceKey) {
    const pool = this.getPool(serviceKey)
    const agent = pool.getNextAgent()
    const userAgent = pool.getNextUserAgent()
    return { agent, userAgent, pool }
  }

  /**
   * Create a persistent session agent that maintains cookies across requests
   * Use this for operations that require login/session state
   * @param {string} sessionId - Unique identifier for this session
   * @param {string} serviceKey - Service identifier
   * @returns {string} sessionId to be used in executeSessionRequest calls
   */
  createSessionAgent (sessionId, serviceKey) {
    if (!this.sessionAgents.has(sessionId)) {
      // Create a dedicated agent just for this session
      const sessionAgent = request.agent()
      const sessionUserAgent = new UserAgent({ deviceCategory: 'desktop' }).toString()
      this.sessionAgents.set(sessionId, {
        agent: sessionAgent,
        serviceKey: serviceKey,
        userAgent: sessionUserAgent,
        createdAt: Date.now()
      })
    }
    return sessionId
  }

  /**
   * Execute request using a session-bound agent (maintains cookies/login)
   * @param {string} sessionId - Session ID from createSessionAgent
   * @param {Function} requestFn - Async function that executes the request
   * @param {Object} options - Configuration options
   */
  async executeSessionRequest (sessionId, requestFn, options = {}) {
    const {
      maxRetries = RETRY_CONFIG.MAX_RETRIES,
      initialDelay = RETRY_CONFIG.INITIAL_DELAY_MS,
      maxDelay = RETRY_CONFIG.MAX_DELAY_MS,
      backoffMultiplier = RETRY_CONFIG.BACKOFF_MULTIPLIER,
      retryStatusCodes = RETRY_CONFIG.RETRY_STATUS_CODES
    } = options

    if (!this.sessionAgents.has(sessionId)) {
      throw new Error(`Session ${sessionId} not found. Call createSessionAgent first.`)
    }

    const sessionData = this.sessionAgents.get(sessionId)
    const { agent, serviceKey } = sessionData
    const userAgent = sessionData.userAgent || new UserAgent({ deviceCategory: 'desktop' }).toString()

    const pool = this.getPool(serviceKey)
    if (pool.isOpen()) {
      const error = new Error(`Service ${serviceKey} is temporarily blocked (circuit breaker open)`)
      error.code = 'CIRCUIT_BREAKER_OPEN'
      throw error
    }

    await limiter.acquire(serviceKey)

    let lastError
    let delay = initialDelay

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await requestFn(agent, userAgent)
        pool.recordSuccess()
        return result
      } catch (error) {
        lastError = error

        const shouldRetry = attempt < maxRetries &&
          (retryStatusCodes.includes(error.status) ||
            error.code === 'ECONNRESET' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ENOTFOUND')

        if (!shouldRetry) {
          pool.recordFailure()
          throw error
        }

        await new Promise(resolve => setTimeout(resolve, delay))
        delay = Math.min(delay * backoffMultiplier, maxDelay)
      }
    }

    pool.recordFailure()
    throw lastError
  }

  /**
   * Clean up session agent
   * @param {string} sessionId - Session ID to clean up
   */
  closeSession (sessionId) {
    this.sessionAgents.delete(sessionId)
  }

  /**
   * Execute a request with automatic retry, rate limiting, and User-Agent rotation
   * @param {string} serviceKey - Service identifier for rate limiting and pooling
   * @param {Function} requestFn - Async function that executes the request (receives agent and userAgent)
   * @param {Object} options - Configuration options
   */
  async executeRequest (serviceKey, requestFn, options = {}) {
    const {
      maxRetries = RETRY_CONFIG.MAX_RETRIES,
      initialDelay = RETRY_CONFIG.INITIAL_DELAY_MS,
      maxDelay = RETRY_CONFIG.MAX_DELAY_MS,
      backoffMultiplier = RETRY_CONFIG.BACKOFF_MULTIPLIER,
      retryStatusCodes = RETRY_CONFIG.RETRY_STATUS_CODES
    } = options

    const pool = this.getPool(serviceKey)

    // Check circuit breaker
    if (pool.isOpen()) {
      const error = new Error(`Service ${serviceKey} is temporarily blocked (circuit breaker open)`)
      error.code = 'CIRCUIT_BREAKER_OPEN'
      throw error
    }

    // Apply rate limiting for this service domain
    await limiter.acquire(serviceKey)

    let lastError
    let delay = initialDelay

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { agent, userAgent } = this.getAgent(serviceKey)
        const result = await requestFn(agent, userAgent)
        pool.recordSuccess()
        return result
      } catch (error) {
        lastError = error

        // Determine if we should retry
        const shouldRetry = attempt < maxRetries &&
          (retryStatusCodes.includes(error.status) ||
            error.code === 'ECONNRESET' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ENOTFOUND')

        if (!shouldRetry) {
          pool.recordFailure()
          throw error
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
        delay = Math.min(delay * backoffMultiplier, maxDelay)
      }
    }

    pool.recordFailure()
    throw lastError
  }

  /**
   * Configure rate limiting for a service
   * @param {string} serviceKey - Service identifier
   * @param {number} requestsPerSecond - Desired rate limit
   */
  configureRateLimit (serviceKey, requestsPerSecond) {
    limiter.configure(serviceKey, requestsPerSecond)
  }

  /**
   * Reset circuit breaker for a service (manual recovery)
   */
  resetService (serviceKey) {
    const pool = this.getPool(serviceKey)
    pool.circuitBreakerOpen = false
    pool.failureCount = 0
  }

  /**
   * Get service status
   */
  getServiceStatus (serviceKey) {
    const pool = this.getPool(serviceKey)
    return {
      isBlocked: pool.isOpen(),
      failureCount: pool.failureCount,
      circuitBreakerThreshold: pool.circuitBreakerThreshold,
      resetTime: pool.circuitBreakerResetTime
    }
  }
}

// Export singleton instance
export const agentManager = new AgentManager()
