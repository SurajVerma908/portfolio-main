/* global process */
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHmac } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { config, defaultUsers } from './config.js'

// ---------------------------------------------------------------------------
// JSON persistence with atomic writes (write temp file, then rename)
// ---------------------------------------------------------------------------
const writeQueue = new Map()

export const readJson = async (path, fallback) => {
  try { return JSON.parse(await readFile(path, 'utf8')) } catch { return fallback }
}

export const writeJson = async (path, data) => {
  const previous = writeQueue.get(path) || Promise.resolve()
  const task = previous.catch(() => {}).then(async () => {
    await mkdir(path.substring(0, path.lastIndexOf(process.platform === 'win32' ? '\\' : '/')) || '.', { recursive: true })
    const temp = `${path}.${process.pid}.${Date.now()}.tmp`
    await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`)
    await rename(temp, path)
  })
  writeQueue.set(path, task)
  return task
}

// ---------------------------------------------------------------------------
// Password hashing (scrypt). Legacy plaintext entries are upgraded on login.
// ---------------------------------------------------------------------------
export const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}

export const verifyPassword = (password, stored) => {
  if (typeof stored !== 'string' || !stored.includes(':')) return stored === password // legacy plaintext
  const [salt, digest] = stored.split(':')
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(digest, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

// ---------------------------------------------------------------------------
// Signed session tokens (HMAC-SHA256 payload, stateless + revocable)
// ---------------------------------------------------------------------------
const sign = (payload) => createHmac('sha256', config.sessionSecret).update(payload).digest('base64url')

export const createToken = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

export const readToken = (token) => {
  if (typeof token !== 'string') return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  const expected = sign(body)
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!payload?.expiresAt || payload.expiresAt < Date.now()) return null
    return payload
  } catch { return null }
}

export const publicUser = (user) => Object.fromEntries(Object.entries(user).filter(([key]) => key !== 'password' && key !== 'hash'))

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const getUsers = async () => {
  let users = await readJson(config.usersPath, null)
  if (!users?.length) {
    users = defaultUsers.map((user) => ({ ...user, password: hashPassword(user.password) }))
    await writeJson(config.usersPath, users).catch(() => {})
    return users
  }
  return users
}

export const saveUsers = (users) => writeJson(config.usersPath, users)

export const authenticateUser = async (username, password) => {
  const users = await getUsers()
  const user = users.find((item) => item.username === username)
  if (!user || !verifyPassword(password, user.password)) return null
  if (typeof user.password === 'string' && !user.password.includes(':')) { // upgrade legacy hash
    user.password = hashPassword(password)
    await saveUsers(users).catch(() => {})
  }
  return user
}

// ---------------------------------------------------------------------------
// Sessions (in-memory, persisted, sliding expiry)
// ---------------------------------------------------------------------------
export const sessions = new Map()

export const loadSessions = async () => {
  const saved = await readJson(config.sessionsPath, [])
  for (const [token, session] of saved) {
    if (session.expiresAt > Date.now() && readToken(token)) sessions.set(token, session)
  }
}

export const persistSessions = () => writeJson(config.sessionsPath, [...sessions.entries()]).catch(() => {})

export const createSession = (user, duration) => {
  const expiresAt = Date.now() + duration
  const token = createToken({ sub: user.id, expiresAt })
  sessions.set(token, { expiresAt, duration, user: publicUser(user) })
  return token
}

export const getSession = (token) => {
  const session = token && sessions.get(token)
  if (!session) return readToken(token)?.sub ? null : null
  if (session.expiresAt < Date.now()) { sessions.delete(token); return null }
  session.expiresAt = Date.now() + session.duration
  return session.user
}

export const revokeSession = (token) => {
  sessions.delete(token)
  return persistSessions()
}

export const newId = randomUUID
