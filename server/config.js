/* global process */
import { resolve } from 'node:path'

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const config = {
  port: toInt(process.env.API_PORT, 8787),
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',

  // Paths
  root: process.cwd(),
  get contentPath() { return resolve(this.root, 'data', 'content.json') },
  get visitorsPath() { return resolve(this.root, 'data', 'visitors.json') },
  get messagesPath() { return resolve(this.root, 'data', 'messages.json') },
  get usersPath() { return resolve(this.root, 'data', 'users.json') },
  get sessionsPath() { return resolve(this.root, 'data', 'sessions.json') },
  get uploadPath() { return resolve(this.root, 'public', 'uploads') },
  get distPath() { return resolve(this.root, 'dist') },

  // Auth
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'surya-admin',
  sessionDuration: toInt(process.env.SESSION_MINUTES, 30) * 60 * 1000,
  rememberedSessionDuration: 30 * 24 * 60 * 60 * 1000,
  sessionSecret: process.env.SESSION_SECRET || 'portfolio-dev-secret-change-me',

  // Uploads
  maxUploadBytes: toInt(process.env.MAX_UPLOAD_MB, 5) * 1024 * 1024,

  // Rate limiting
  rateLimit: {
    windowMs: 60 * 1000,
    max: toInt(process.env.RATE_LIMIT_MAX, 120),
    loginMax: toInt(process.env.RATE_LIMIT_LOGIN_MAX, 10),
  },

  // Body size
  maxBodyBytes: 12 * 1024 * 1024,
}

export const defaultUsers = [{
  id: 'superadmin',
  username: config.adminUsername,
  name: 'Super Admin',
  role: 'superadmin',
  password: config.adminPassword,
}]
