import { readBody, requireSuperAdmin } from '../middleware.js'
import { publicUser, findUserByName, addUser, updateUser, deleteUser, persistUsers, currentUsername } from '../store.js'
import { sendJson, sendError, notFound } from '../http.js'

export const listUsers = async (request, response) => {
  requireSuperAdmin(request)
  const { users } = await import('../store.js')
  return sendJson(response, 200, { users: users.map(publicUser) })
}

export const createUser = async (request, response) => {
  requireSuperAdmin(request)
  const { username, password, role } = await readBody(request)
  if (!username?.trim() || !password || password.length < 6) {
    return sendError(response, 422, 'Username and a password of at least 6 characters are required')
  }
  if (findUserByName(username.trim())) return sendError(response, 409, 'That username already exists')
  const user = addUser({ username: username.trim(), password, role: role === 'admin' ? 'admin' : 'editor' })
  await persistUsers()
  return sendJson(response, 201, { user: publicUser(user) })
}

export const updateUserRoute = async (request, response, params) => {
  requireSuperAdmin(request)
  const body = await readBody(request)
  const user = updateUser(params.id, {
    ...(body.role ? { role: body.role === 'admin' ? 'admin' : 'editor' } : {}),
    ...(body.password ? { password: body.password } : {}),
    ...(body.username ? { username: String(body.username).trim() } : {}),
  })
  if (!user) return sendError(response, 404, 'User not found')
  if (user.username === currentUsername && user.role !== 'admin') {
    return sendError(response, 400, 'You cannot demote your own account')
  }
  await persistUsers()
  return sendJson(response, 200, { user: publicUser(user) })
}

export const deleteUserRoute = async (request, response, params) => {
  requireSuperAdmin(request)
  const user = deleteUser(params.id)
  if (!user) return notFound(response)
  if (user.username === currentUsername) return sendError(response, 400, 'You cannot delete your own account')
  await persistUsers()
  return sendJson(response, 200, { ok: true })
}
