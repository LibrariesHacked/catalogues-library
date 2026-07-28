/**
 * Simple rate limiter that throttles requests per domain
 * Ensures requests are spaced out according to configured rate limits
 */
class RateLimiter {
  constructor (requestsPerSecond) {
    // Minimum milliseconds between requests
    this.minInterval = 1000 / requestsPerSecond
    this.lastRequestTime = 0
  }

  /**
   * Wait until the next request can be made
   * Ensures minimum interval has passed since last request
   */
  async acquire () {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    const waitTime = Math.max(0, this.minInterval - timeSinceLastRequest)

    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastRequestTime = Date.now()
  }
}

/**
 * RequestLimiter manages per-domain rate limiting
 * Simple and straightforward: each domain gets its own rate limit
 */
export class RequestLimiter {
  constructor () {
    this.limiters = new Map()
    // Default: 1 request per second per domain
    this.defaultRequestsPerSecond = 1
  }

  /**
   * Configure rate limit for a specific domain
   * @param {string} domain - Domain/service identifier (e.g., 'aspen', 'koha')
   * @param {number} requestsPerSecond - Max requests per second (e.g., 0.5 = 1 request every 2 seconds)
   */
  configure (domain, requestsPerSecond) {
    this.limiters.set(domain, new RateLimiter(requestsPerSecond))
  }

  /**
   * Get or create a limiter for a domain
   */
  getLimiter (domain) {
    if (!this.limiters.has(domain)) {
      this.limiters.set(domain, new RateLimiter(this.defaultRequestsPerSecond))
    }
    return this.limiters.get(domain)
  }

  /**
   * Wait until a request can be made to the domain
   */
  async acquire (domain) {
    const limiter = this.getLimiter(domain)
    await limiter.acquire()
  }
}

export const limiter = new RequestLimiter()
