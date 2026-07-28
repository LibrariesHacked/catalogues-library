export const TIMEOUTS = {
  SHORT: 1000,
  MEDIUM: 2000,
  DEFAULT: 20000,
  LONG: 30000,
  EXTRA_LONG: 60000
}

export const RETRY_DELAY_MS = 1000

export const SPYDUS_COOKIE = 'ALLOWCOOKIES_443=1'

/**
 * Anti-bot strategy configuration per service
 * Customize rate limits for specific services that are more aggressive with blocking
 */
export const RATE_LIMITS = {
  // Format: serviceKey: requestsPerSecond
  aspen: 0.5, // 1 request per 2 seconds
  koha: 1, // 1 request per second
  spydus: 0.5,
  prism3: 0.5,
  enterprise: 1,
  durham: 1,
  iguana: 1,
  arena: 1,
  webpac: 1,
  luci: 1
}
