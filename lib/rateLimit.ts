import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitOptions {
  limit:    number;  // max requests
  window:   number;  // time window in ms
  message?: string;
}

const caches = new Map<string, LRUCache<string, number>>();

function getCache(window: number) {
  const key = String(window);
  if (!caches.has(key)) {
    caches.set(key, new LRUCache<string, number>({ max: 10000, ttl: window }));
  }
  return caches.get(key)!;
}

export function rateLimit(req: NextRequest, options: RateLimitOptions): NextResponse | null {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  const routeKey = `${ip}:${req.nextUrl.pathname}`;
  const cache    = getCache(options.window);
  const current  = (cache.get(routeKey) || 0) + 1;
  cache.set(routeKey, current);

  if (current > options.limit) {
    return NextResponse.json(
      { error: options.message || 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After':       String(Math.ceil(options.window / 1000)),
          'X-RateLimit-Limit': String(options.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }
  return null; // not rate limited
}

// Presets for common routes
export const LIMITS = {
  login:    { limit: 10,  window: 15 * 60 * 1000, message: 'Too many login attempts. Try again in 15 minutes.' },
  register: { limit: 5,   window: 60 * 60 * 1000, message: 'Too many registrations from this IP.' },
  order:    { limit: 20,  window: 60 * 60 * 1000, message: 'Too many orders. Please slow down.' },
  review:   { limit: 5,   window: 60 * 60 * 1000, message: 'Too many reviews submitted.' },
  api:      { limit: 100, window: 60 * 1000,       message: 'API rate limit exceeded.' },
  upload:   { limit: 20,  window: 60 * 60 * 1000, message: 'Too many uploads.' },
};
