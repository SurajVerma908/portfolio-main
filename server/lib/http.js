/**
 * HTTP kernel — router, middleware chain, rate limiting, security headers.
 */
import { getSession } from './auth.js'

const MAX_BODY = 1024 * 1024 // 1 MB

/* ---------- security headers ---------- */

export function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'same-origin')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
}

/* ---------- body parsing with size guard ---------- */

export function readBody(request, limit = MAX_BODY) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', reject)
  })
}

export async function parseJsonBody(request) {
  const raw = await readBody(request)
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { status: 400 })
  }
}

/* ---------- response helpers ---------- */

export function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(data))
}

export const fail = (res, status, message) => sendJson(res, status, { error: message })

/* ---------- rate limiter (sliding window, per IP+route class) ---------- */

const buckets = new Map()
const WINDOW = 60_000

export function rateLimit(key, max) {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + WINDOW })
    return { ok: true, remaining: max - 1 }
  }
  bucket.count += 1
  return { ok: bucket.count <= max, remaining: Math.max(0, max - bucket.count) }
}

// occasional cleanup so the map cannot grow forever
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) if (bucket.reset < now) buckets.delete(key)
}, WINDOW).unref()

/* ---------- middleware-style guards ---------- */

export function requireAuth(request, res) {
  const user = getSession(request)
  if (!user) {
    fail(res, 401, 'Authentication required')
    return null
  }
  return user
}

export function requireRole(request, res, ...roles) {
  const user = requireAuth(request, res)
  if (!user) return null
  if (roles.length && !roles.includes(user.role)) {
    fail(res, 403, 'Insufficient permissions')
    return null
  }
  return user
}

/* ---------- structured request logging ---------- */

export function logRequest(request, res, started) {
  res.on('finish', () => {
    const ms = (performance.now() - started).toFixed(1).padStart(7)
    const status = String(res.statusCode).padEnd(3)
    const method = request.method.padEnd(6)
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn ' : 'info '
    console.log(`[${level}] ${status} ${ms}ms  ${method} ${request.url}`)
  })
}
