import { config } from '../config.js'
import { authenticateUser, createSession, publicUser, persistSessions, revokeSession, getSession } from '../store.js'
import { readBody, rateLimit, clientIp, requireSuperAdmin, bearerToken } from '../middleware.js'

export const login = async (request, response) => {
  if (!rateLimit(`login:${clientIp(request)}`, config.rateLimit.loginMax)) {
    return sendError(response, 429, 'Too many login attempts. Try again in a minute.')
  }
  const { username, password, remember } = await readBody(request)
  if (!username?.trim() || !password) return sendError(response, 400, 'Username and password are required')
  const user = await authenticateUser(username.trim(), password)
  if (!user) return sendError(response, 401, 'Incorrect username or password')
  const duration = remember ? config.rememberedSessionDuration : config.sessionDuration
  const token = createSession(user, duration)
  await persistSessions()
  return sendJson(response, 200, { token, user: publicUser(user) })
}

export const logout = async (request, response) => {
  const token = bearerToken(request)
  if (token) await revokeSession(token)
  return sendJson(response, 200, { ok: true })
}

export const me = async (request, response) => {
  const user = getSession(bearerToken(request))
  if (!user) return sendError(response, 401, 'Authentication required')
  return sendJson(response, 200, { user })
}

// shared helpers to avoid circular imports with router
import { sendJson, sendError } from '../http.js'
