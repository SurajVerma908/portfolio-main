import { readBody, requireUser, requireAdmin, requireSuperAdmin } from '../middleware.js'
import { loadContent, saveContent, newId } from '../store.js'
import { sendJson, sendError } from '../http.js'
import { collections, slugify, orderFields } from './schema.js'

const findCollection = (name) => collections[name]

const sortItems = (items) => [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.createdAt || '').localeCompare(String(b.createdAt || '')))

export const listCollection = async (request, response, params) => {
  const collection = findCollection(params.collection)
  if (!collection) return notFoundResponse(response)
  const data = await loadContent()
  return sendJson(response, 200, { items: sortItems(data[params.collection] || []) })
}

export const createItem = async (request, response, params) => {
  const collection = findCollection(params.collection)
  if (!collection) return notFoundResponse(response)
  requireAdmin(request)
  const body = await readBody(request)
  const error = collection.validate(body, {})
  if (error) return sendError(response, 422, error)
  const data = await loadContent()
  const items = data[params.collection] || []
  const now = new Date().toISOString()
  const item = {
    id: newId(),
    ...collection.fields.reduce((acc, field) => {
      if (body[field] !== undefined) acc[field] = body[field]
      return acc
    }, {}),
    ...(collection.slugFrom && !body.slug ? { slug: slugify(body[collection.slugFrom]) } : {}),
    ...(body.slug ? { slug: slugify(body.slug) } : {}),
    order: Number.isFinite(body.order) ? body.order : items.length,
    published: body.published !== false,
    createdAt: now,
    updatedAt: now,
  }
  if (collection.unique && items.some((existing) => collection.unique.some((key) => existing[key] && existing[key] === item[key]))) {
    return sendError(response, 409, `An item with this ${collection.unique.join('/')} already exists`)
  }
  items.push(item)
  data[params.collection] = items
  await saveContent(data)
  return sendJson(response, 201, { item })
}

export const updateItem = async (request, response, params) => {
  const collection = findCollection(params.collection)
  if (!collection) return notFoundResponse(response)
  requireAdmin(request)
  const body = await readBody(request)
  const data = await loadContent()
  const items = data[params.collection] || []
  const index = items.findIndex((item) => item.id === params.id)
  if (index === -1) return sendError(response, 404, 'Item not found')
  const error = collection.validate(body, items[index])
  if (error) return sendError(response, 422, error)
  const updated = {
    ...items[index],
    ...collection.fields.reduce((acc, field) => {
      if (body[field] !== undefined) acc[field] = body[field]
      return acc
    }, {}),
    ...(body.slug ? { slug: slugify(body.slug) } : {}),
    ...(body.order !== undefined ? { order: Number(body.order) || 0 } : {}),
    ...(body.published !== undefined ? { published: !!body.published } : {}),
    updatedAt: new Date().toISOString(),
  }
  items[index] = updated
  data[params.collection] = items
  await saveContent(data)
  return sendJson(response, 200, { item: updated })
}

export const deleteItem = async (request, response, params) => {
  const collection = findCollection(params.collection)
  if (!collection) return notFoundResponse(response)
  requireAdmin(request)
  const data = await loadContent()
  const items = data[params.collection] || []
  const index = items.findIndex((item) => item.id === params.id)
  if (index === -1) return sendError(response, 404, 'Item not found')
  const [removed] = items.splice(index, 1)
  data[params.collection] = items
  await saveContent(data)
  return sendJson(response, 200, { ok: true, item: removed })
}

export const reorderCollection = async (request, response, params) => {
  const collection = findCollection(params.collection)
  if (!collection) return notFoundResponse(response)
  requireAdmin(request)
  const { ids } = await readBody(request)
  if (!Array.isArray(ids)) return sendError(response, 400, 'ids array is required')
  const data = await loadContent()
  const items = data[params.collection] || []
  ids.forEach((id, index) => {
    const item = items.find((entry) => entry.id === id)
    if (item) item.order = index
  })
  data[params.collection] = sortItems(items)
  await saveContent(data)
  return sendJson(response, 200, { items: data[params.collection] })
}

export const publishCollection = async (request, response, params) => {
  const collection = findCollection(params.collection)
  if (!collection) return notFoundResponse(response)
  requireAdmin(request)
  const { published } = await readBody(request)
  const data = await loadContent()
  const items = data[params.collection] || []
  items.forEach((item) => { item.published = !!published })
  data[params.collection] = items
  await saveContent(data)
  return sendJson(response, 200, { items })
}

const notFoundResponse = (response) => sendError(response, 404, 'Unknown collection')
