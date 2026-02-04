export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Basic in-memory rate limiter for Edge Runtime.
 * Note: Global state is not perfectly persistent in Edge, but provides a line of defense.
 * For production, consider using Upstash Redis.
 */
const caches = new Map<string, { timestamp: number }[]>();

// Cleanup interval to prevent memory leaks (runs occasionally)
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 1000 * 60 * 5; // 5 minutes

export async function rateLimit(
  identifier: string,
  limit: number = 20,
  windowMs: number = 60000 // 1 minute
): Promise<RateLimitResult> {
  const now = Date.now();
  
  // Occasional cleanup of the entire cache
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, requests] of caches.entries()) {
      const filtered = requests.filter(req => now - req.timestamp < windowMs * 2);
      if (filtered.length === 0) {
        caches.delete(key);
      } else {
        caches.set(key, filtered);
      }
    }
    lastCleanup = now;
  }

  let requests = caches.get(identifier) || [];
  const windowStart = now - windowMs;
  
  // Filter out requests outside the current window
  requests = requests.filter(req => req.timestamp > windowStart);
  
  if (requests.length >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil((requests[0].timestamp + windowMs - now) / 1000)
    };
  }
  
  // Record current request
  requests.push({ timestamp: now });
  caches.set(identifier, requests);
  
  return {
    success: true,
    limit,
    remaining: limit - requests.length,
    reset: Math.ceil((requests[0].timestamp + windowMs - now) / 1000)
  };
}
