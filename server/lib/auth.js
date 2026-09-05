/**
 * Auth — scrypt password hashing, session tokens, boot-time migration
 * of legacy plaintext users, and role-based access helpers.
 */
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { mutate, readJson, writeJson } from './store.js'

const SESSION_TTL = 30 * 60 * 1000            // 30 minutes of activity
const REMEMBER_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days with "remember me"

const usersFile = 'users.json'
const sessionsFile = 'sessions.json'
const sessions = new Map()

export const defaultUsers = [{
  id: 'superadmin',
  username: 'admin',
  name: 'Super Admin',
  role: 'superadmin',
  password: process.env.ADMIN_PASSWORD || 'surya-admin',
}]

/* ---------- password hashing ---------- */

export function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(plain, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(plain, stored) {
  if (!stored) return false
  if (stored.startsWith('scrypt:')) {
    const [, salt, hash] = stored.split(':')
    const candidate = scryptSync(plain, salt, 64)
    const expected = Buffer.from(hash, 'hex')
    return candidate.length === expected.length && timingSafeEqual(candidate, expected)
  }
  return plain === stored // legacy plaintext, migrated at boot
}

/* ---------- boot: seed users + hash legacy passwords ---------- */

export async function initUsers() {
  let users = await readJson(usersFile, [])
  if (!users.length) {
    users = defaultUsers
    await writeJson(usersFile, users)
  }
  let migrated = false
  for (const user of users) {
    if (!user.password?.startsWith('scrypt:')) {
      user.password = hashPassword(user.password)
      migrated = true
    }
  }
  if (migrated) await writeJson(usersFile, users)
  // restore persisted sessions
  for (const [token, session] of await readJson(sessionsFile, [])) {
    if (session.expiresAt > Date.now()) sessions.set(token, session)
  }
  if (migrated) console.log(`  auth: migrated ${users.length} user password(s) to scrypt`)
}

/* ---------- sessions ---------- */

const persistSessions = () => writeJson(sessionsFile, [...sessions.entries()]).catch(() => {})

export function createSession(user, remember = false) {
  const duration = remember ? REMEMBER_TTL : SESSION_TTL
  const token = randomUUID()
  sessions.set(token, { token, user: publicUser(user), duration, expiresAt: Date.now() + duration })
  persistSessions()
  return sessions.get(token)
}

export function destroySession(token) {
  if (!token) return false
  sessions.delete(token)
  persistSessions()
  return true
}

/** Returns the session user, sliding the expiry forward. Null if invalid/expired. */
export function getSession(request) {
  const token = request.headers.authorization?.replace('Bearer ', '')
  const session = token && sessions.get(token)
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token)
    return null
  }
  session.expiresAt = Date.now() + session.duration
  return session.user
}

/* ---------- users ---------- */

export const publicUser = (user) => Object.fromEntries(Object.entries(user).filter(([key]) => key !== 'password'))

export function getUsers() {
  return readJson(usersFile, defaultUsers)
}

export async function authenticate(username, password) {
  const users = await getUsers()
  const user = users.find((item) => item.username === username)
  // constant-ish response time: always run a verify
  const ok = user && verifyPassword(password, user.password)
  if (!ok) verifyPassword(password, hashPassword('decoy-value'))
  return ok ? user : null
}

export async function createUser({ username, name, password, role }) {
  const users = await getUsers()
  if (users.some((item) => item.username === username)) return { error: 'Username already exists', status: 409 }
  const newUser = { id: randomUUID(), username, name, password: hashPassword(password), role }
  users.push(newUser)
  await writeJson(usersFile, users)
  return { user: publicUser(newUser) }
}

export async function resetPassword(id, password) {
  return mutate(usersFile, defaultUsers, (users) => {
    const target = users.find((item) => item.id === id)
    if (!target) return { error: 'User not found', status: 404 }
    target.password = hashPassword(password)
    return { user: publicUser(target) }
  })
}
