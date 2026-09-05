/* global process */
import { config } from './config.js'
import { getSession } from './store.js'

// ---------------------------------------------------------------------------
// Security headers + CORS
// ---------------------------------------------------------------------------
export const applySecurityHeaders = (response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('X-Frame-Options', 'DENY')
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.setHeader('X-XSS-Protection', '0')
  if (config.isProd) response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
}

export const applyCors = (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.setHeader('Access-Control-Max-Age', '86400')
}

// ---------------------------------------------------------------------------
// Request logger
// ---------------------------------------------------------------------------
export const logRequest = (request, response, startedAt) => {
  response.on('finish', () => {
    const ms = Date.now() - startedAt
    const line = `${request.method} ${request.url} ${response.statusCode} ${ms}ms`
    if (response.statusCode >= 500) console.error(`[api] ${line}`)
    else console.log(`[api] ${line}`)
  })
}

// ---------------------------------------------------------------------------
// Rate limiting (per IP, sliding window)
// ---------------------------------------------------------------------------
const buckets = new Map()
setInterval(() => {
  const cutoff = Date.now() - config.rateLimit.windowMs
  for (const [key, hits] of buckets) {
    const alive = hits.filter((time) => time > cutoff)
    if (alive.length) buckets.set(key, alive)
    else buckets.delete(key)
  }
}, config.rateLimit.windowMs).unref()

export const rateLimit = (key, max) => {
  const now = Date.now()
  const cutoff = now - config.rateLimit.windowMs
  const hits = (buckets.get(key) || []).filter((time) => time > cutoff)
  hits.push(now)
  buckets.set(key, hits)
  return hits.length <= max
}

export const clientIp = (request) => request.socket.remoteAddress || 'unknown'

// ---------------------------------------------------------------------------
// Body parsing with size guard
// ---------------------------------------------------------------------------
export const readBody = async (request) => {
  let size = 0
  const chunks = []
  for await (const chunk of request) {
    size += chunk.length
    if (size > config.maxBodyBytes) throw Object.assign(new Error('Payload too large'), { status: 413 })
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { throw Object.assign(new Error('Invalid JSON body'), { status: 400 }) }
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------
export const bearerToken = (request) => request.headers.authorization?.replace('Bearer ', '')

export const currentUser = (request) => getSession(bearerToken(request))

export const requireUser = (request) => {
  const user = currentUser(request)
  if (!user) throw Object.assign(new Error('Authentication required'), { status: 401 })
  return user
}

export const requireAdmin = (request) => {
  const user = requireUser(request)
  if (user.role === 'staff') throw Object.assign(new Error('Admin permission required'), { status: 403 })
  return user
}

export const requireSuperAdmin = (request) => {
  const user = requireUser(request)
  if (user.role !== 'superadmin') throw Object.assign(new Error('Super admin access required'), { status: 403 })
  return user
}
