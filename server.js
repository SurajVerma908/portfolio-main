/* global process */
import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'

const port = Number(process.env.API_PORT || 8787)
const contentPath = resolve('content.json')
const uploadPath = resolve('public', 'uploads')
const visitorsPath = resolve('visitors.json')
const messagesPath = resolve('messages.json')
const usersPath = resolve('users.json')
const defaultUsers = [{ id: 'superadmin', username: 'admin', name: 'Super Admin', role: 'superadmin', password: process.env.ADMIN_PASSWORD || 'surya-admin' }]
const sessionDuration = 30 * 60 * 1000
const rememberedSessionDuration = 30 * 24 * 60 * 60 * 1000
const sessions = new Map()
const sessionsPath = resolve('sessions.json')

const persistSessions = () => writeJsonFile(sessionsPath, [...sessions.entries()]).catch(() => {})

const send = (response, status, data) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  })
  response.end(JSON.stringify(data))
}

const readBody = async (request) => {
  let body = ''
  for await (const chunk of request) body += chunk
  return JSON.parse(body)
}

const readJsonFile = async (path, fallback) => {
  try { return JSON.parse(await readFile(path, 'utf8')) } catch { return fallback }
}

readJsonFile(sessionsPath, []).then((saved) => {
  for (const [token, session] of saved) if (session.expiresAt > Date.now()) sessions.set(token, session)
}).catch(() => {})

const writeJsonFile = (path, data) => writeFile(path, `${JSON.stringify(data, null, 2)}\n`)

const removeGalleryImageFile = async (image) => {
  const galleryPath = image?.replace('/uploads/gallery/', '')
  const rootPath = image?.replace('/uploads/', '')
  if (galleryPath && /^[a-z0-9-]+\/[a-zA-Z0-9._-]+$/.test(galleryPath)) await rm(resolve(uploadPath, 'gallery', galleryPath), { force: true })
  else if (rootPath && /^[a-zA-Z0-9._-]+$/.test(rootPath)) await rm(resolve(uploadPath, rootPath), { force: true })
}

const getUsers = async () => {
  const users = await readJsonFile(usersPath, defaultUsers)
  if (!users.length) await writeJsonFile(usersPath, defaultUsers)
  return users.length ? users : defaultUsers
}

const publicUser = (user) => Object.fromEntries(Object.entries(user).filter(([key]) => key !== 'password'))

const getUser = (request) => {
  const token = request.headers.authorization?.replace('Bearer ', '')
  const session = token && sessions.get(token)
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token)
    return null
  }
  session.expiresAt = Date.now() + session.duration
  return session.user
}

const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
}

const serveUpload = async (request, response) => {
  try {
    const relative = decodeURIComponent(request.url.replace(/^\/uploads\//, ''))
    const filePath = normalize(join(uploadPath, relative))
    if (!filePath.startsWith(uploadPath)) return send(response, 403, { error: 'Forbidden' })
    const data = await readFile(filePath)
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=604800',
      'Access-Control-Allow-Origin': '*',
    })
    return response.end(data)
  } catch {
    return send(response, 404, { error: 'Image not found' })
  }
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return send(response, 204, {})
  if (request.url.startsWith('/uploads/')) return serveUpload(request, response)
  if (request.url === '/api/login' && request.method === 'POST') {
    try {
      const { username, password, remember } = await readBody(request)
      const user = (await getUsers()).find((item) => item.username === username && item.password === password)
      if (!user) return send(response, 401, { error: 'Incorrect username or password' })
      const token = randomUUID()
      const duration = remember ? rememberedSessionDuration : sessionDuration
      sessions.set(token, { expiresAt: Date.now() + duration, duration, user: publicUser(user) })
      persistSessions()
      return send(response, 200, { token, user: publicUser(user) })
    } catch (error) {
      return send(response, 400, { error: error.message })
    }
  }

  if (request.url === '/api/logout' && request.method === 'POST') {
    const token = request.headers.authorization?.replace('Bearer ', '')
    if (token) { sessions.delete(token); persistSessions() }
    return send(response, 200, { ok: true })
  }

  if (request.url === '/api/visit' && request.method === 'POST') {
    const visitors = await readJsonFile(visitorsPath, { count: 0 })
    visitors.count += 1
    await writeJsonFile(visitorsPath, visitors)
    return send(response, 200, visitors)
  }

  if (request.url === '/api/messages' && request.method === 'POST') {
    const body = await readBody(request)
    if (!body.name?.trim() || !body.email?.trim() || !body.message?.trim()) return send(response, 400, { error: 'Name, email, and message are required' })
    const messages = await readJsonFile(messagesPath, [])
    const message = { id: randomUUID(), name: body.name.trim(), email: body.email.trim(), phone: body.phone?.trim() || '', subject: body.subject?.trim() || '', message: body.message.trim(), createdAt: new Date().toISOString() }
    messages.unshift(message)
    await writeJsonFile(messagesPath, messages)
    return send(response, 201, { ok: true })
  }

  if (request.url === '/api/admin-data' && request.method === 'GET') {
    const user = getUser(request)
    if (!user) return send(response, 401, { error: 'Authentication required' })
    return send(response, 200, { user, visitors: await readJsonFile(visitorsPath, { count: 0 }), messages: await readJsonFile(messagesPath, []) })
  }

  if (request.url === '/api/upload' && request.method === 'POST') {
    if (!getUser(request) || getUser(request).role === 'staff') return send(response, 401, { error: 'Admin permission required' })
    const { filename, data, folder, albumId } = await readBody(request)
    if (!filename || !data?.startsWith('data:image/')) return send(response, 400, { error: 'An image file is required' })
    if (folder && folder !== 'gallery') return send(response, 400, { error: 'Invalid upload folder' })
    if (albumId && (!folder || !/^[a-z0-9-]+$/.test(albumId))) return send(response, 400, { error: 'Invalid album' })
    const [, mime, encoded] = data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/) || []
    if (!mime || !encoded) return send(response, 400, { error: 'Invalid image data' })
    if (Buffer.byteLength(encoded, 'base64') > 5 * 1024 * 1024) return send(response, 413, { error: 'Image must be smaller than 5MB' })
    const extension = mime.split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg')
    const relativeFolder = [folder, albumId].filter(Boolean).join('/')
    const destinationPath = relativeFolder ? resolve(uploadPath, relativeFolder) : uploadPath
    const destinationUrl = relativeFolder ? `/uploads/${relativeFolder}` : '/uploads'
    const baseName = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-') || 'image'
    const safeName = `${Date.now()}-${baseName}.${extension}`
    await mkdir(destinationPath, { recursive: true })
    await writeFile(resolve(destinationPath, safeName), Buffer.from(encoded, 'base64'))
    return send(response, 201, { url: `${destinationUrl}/${safeName}` })
  }

  if (request.url === '/api/users' && request.method === 'GET') {
    const user = getUser(request)
    if (!user || user.role !== 'superadmin') return send(response, 403, { error: 'Super admin access required' })
    return send(response, 200, (await getUsers()).map(publicUser))
  }

  if (request.url === '/api/users' && request.method === 'POST') {
    const user = getUser(request)
    if (!user || user.role !== 'superadmin') return send(response, 403, { error: 'Super admin access required' })
    const body = await readBody(request)
    if (!body.username?.trim() || !body.name?.trim() || !body.password?.trim() || !['admin', 'staff'].includes(body.role)) return send(response, 400, { error: 'Name, username, password, and role are required' })
    const users = await getUsers()
    if (users.some((item) => item.username === body.username.trim())) return send(response, 409, { error: 'Username already exists' })
    const newUser = { id: randomUUID(), username: body.username.trim(), name: body.name.trim(), role: body.role, password: body.password }
    users.push(newUser)
    await writeJsonFile(usersPath, users)
    return send(response, 201, publicUser(newUser))
  }

  if (request.url === '/api/users/reset' && request.method === 'PUT') {
    const user = getUser(request)
    if (!user || user.role !== 'superadmin') return send(response, 403, { error: 'Super admin access required' })
    const body = await readBody(request)
    const users = await getUsers()
    const target = users.find((item) => item.id === body.id)
    if (!target || !body.password?.trim()) return send(response, 400, { error: 'User and new password are required' })
    target.password = body.password
    await writeJsonFile(usersPath, users)
    return send(response, 200, publicUser(target))
  }

  if (request.url === '/api/gallery/album' && request.method === 'POST') {
    const user = getUser(request)
    if (!user || user.role === 'staff') return send(response, 401, { error: 'Admin permission required' })
    const { id, title, description } = await readBody(request)
    if (!/^[a-z0-9-]+$/.test(id || '') || !title?.trim()) return send(response, 400, { error: 'Album name is required' })
    const content = JSON.parse(await readFile(contentPath, 'utf8'))
    content.galleryAlbums ||= []
    if (content.galleryAlbums.some((album) => album.id === id)) return send(response, 409, { error: 'Album already exists' })
    await mkdir(resolve(uploadPath, 'gallery', id), { recursive: true })
    content.galleryAlbums.push({ id, title: title.trim(), description: description?.trim() || '' })
    await writeJsonFile(contentPath, content)
    return send(response, 201, content)
  }

  if (request.url === '/api/gallery/album' && request.method === 'PUT') {
    const user = getUser(request)
    if (!user || user.role === 'staff') return send(response, 401, { error: 'Admin permission required' })
    const { id, title, description } = await readBody(request)
    if (!/^[a-z0-9-]+$/.test(id || '') || !title?.trim()) return send(response, 400, { error: 'Album name is required' })
    const content = JSON.parse(await readFile(contentPath, 'utf8'))
    if (!(content.galleryAlbums || []).some((album) => album.id === id)) return send(response, 404, { error: 'Album not found' })
    content.galleryAlbums = content.galleryAlbums.map((album) => album.id === id ? { ...album, title: title.trim(), description: description?.trim() || '' } : album)
    await writeJsonFile(contentPath, content)
    return send(response, 200, content)
  }

  if (request.url === '/api/gallery/album' && request.method === 'DELETE') {
    const user = getUser(request)
    if (!user || user.role === 'staff') return send(response, 401, { error: 'Admin permission required' })
    const { id } = await readBody(request)
    if (!/^[a-z0-9-]+$/.test(id || '')) return send(response, 400, { error: 'Invalid album' })
    const content = JSON.parse(await readFile(contentPath, 'utf8'))
    if (!(content.galleryAlbums || []).some((album) => album.id === id)) return send(response, 404, { error: 'Album not found' })
    await rm(resolve(uploadPath, 'gallery', id), { recursive: true, force: true })
    content.galleryAlbums = content.galleryAlbums.filter((album) => album.id !== id)
    content.gallery = (content.gallery || []).filter((item) => item.albumId !== id)
    await writeJsonFile(contentPath, content)
    return send(response, 200, content)
  }

  if (request.url === '/api/gallery/photo' && request.method === 'POST') {
    const user = getUser(request)
    if (!user || user.role === 'staff') return send(response, 401, { error: 'Admin permission required' })
    const { id, title = '', category = '', image, albumId } = await readBody(request)
    if (!id || !/^[a-z0-9-]+$/.test(albumId || '') || !image?.startsWith(`/uploads/gallery/${albumId}/`)) return send(response, 400, { error: 'Invalid gallery photo' })
    const content = JSON.parse(await readFile(contentPath, 'utf8'))
    if (!(content.galleryAlbums || []).some((album) => album.id === albumId)) return send(response, 404, { error: 'Album not found' })
    content.gallery ||= []
    if (content.gallery.some((item) => item.id === id)) return send(response, 409, { error: 'Photo already exists' })
    content.gallery.push({ id, title: title.trim(), category: category.trim(), image, albumId })
    await writeJsonFile(contentPath, content)
    return send(response, 201, content)
  }

  if (request.url === '/api/gallery/photo' && request.method === 'PUT') {
    const user = getUser(request)
    if (!user || user.role === 'staff') return send(response, 401, { error: 'Admin permission required' })
    const { id, title, category, image, albumId } = await readBody(request)
    const content = JSON.parse(await readFile(contentPath, 'utf8'))
    const photo = content.gallery?.find((item) => item.id === id)
    if (!photo) return send(response, 404, { error: 'Photo not found' })
    const nextAlbumId = albumId || photo.albumId || ''
    const movingAlbumPhoto = photo.albumId && photo.albumId !== nextAlbumId
    if (nextAlbumId && (!/^[a-z0-9-]+$/.test(nextAlbumId) || !(content.galleryAlbums || []).some((album) => album.id === nextAlbumId))) return send(response, 400, { error: 'Invalid album' })
    let nextImage = typeof image === 'string' ? image : photo.image
    const localImage = photo.image?.match(/^\/uploads\/gallery\/([a-z0-9-]+)\/([a-zA-Z0-9._-]+)$/)
    if (movingAlbumPhoto && nextImage === photo.image && localImage && localImage[1] === photo.albumId) {
      await mkdir(resolve(uploadPath, 'gallery', nextAlbumId), { recursive: true })
      await rename(resolve(uploadPath, 'gallery', localImage[1], localImage[2]), resolve(uploadPath, 'gallery', nextAlbumId, localImage[2]))
      nextImage = `/uploads/gallery/${nextAlbumId}/${localImage[2]}`
    }
    if (nextImage !== photo.image) await removeGalleryImageFile(photo.image)
    const nextPhoto = { ...photo, title: typeof title === 'string' ? title.trim() : photo.title, category: typeof category === 'string' ? category.trim() : photo.category, image: nextImage, albumId: nextAlbumId }
    content.gallery = content.gallery.map((item) => item.id === id ? nextPhoto : item)
    await writeJsonFile(contentPath, content)
    return send(response, 200, content)
  }

  if (request.url === '/api/gallery/photo' && request.method === 'DELETE') {
    const user = getUser(request)
    if (!user || user.role === 'staff') return send(response, 401, { error: 'Admin permission required' })
    const { id } = await readBody(request)
    const content = JSON.parse(await readFile(contentPath, 'utf8'))
    const photo = content.gallery?.find((item) => item.id === id)
    if (!photo) return send(response, 404, { error: 'Photo not found' })
    await removeGalleryImageFile(photo.image)
    content.gallery = content.gallery.filter((item) => item.id !== id)
    await writeJsonFile(contentPath, content)
    return send(response, 200, content)
  }

  if (request.url !== '/api/content') return send(response, 404, { error: 'Not found' })

  try {
    if (request.method === 'GET') {
      return send(response, 200, JSON.parse(await readFile(contentPath, 'utf8')))
    }

    if (request.method === 'PUT') {
      const user = getUser(request)
      if (!user || user.role === 'staff') return send(response, 401, { error: 'Admin permission required' })
      const content = await readBody(request)
      await writeFile(contentPath, `${JSON.stringify(content, null, 2)}\n`)
      return send(response, 200, content)
    }

    return send(response, 405, { error: 'Method not allowed' })
  } catch (error) {
    return send(response, 400, { error: error.message })
  }
})

server.listen(port, () => console.log(`Content API running at http://localhost:${port}`))
