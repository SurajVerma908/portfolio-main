/**
 * JSON Store — tiny persistence layer with read-through cache and atomic writes.
 * All data lives in JSON files (content.json, users.json, etc.).
 */
import { readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const cache = new Map()

export const file = (name) => resolve(process.cwd(), name)

export async function readJson(name, fallback) {
  if (cache.has(name)) return cache.get(name)
  try {
    const data = JSON.parse(await readFile(file(name), 'utf8'))
    cache.set(name, data)
    return data
  } catch {
    cache.set(name, fallback)
    return fallback
  }
}

/** Atomic write: write to temp file then rename, so a crash never corrupts data. */
export async function writeJson(name, data) {
  cache.set(name, data)
  const target = file(name)
  const tmp = `${target}.${process.pid}.tmp`
  await mkdirp(dirname(target))
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`)
  await rename(tmp, target)
}

async function mkdirp(dir) {
  const { mkdir } = await import('node:fs/promises')
  await mkdir(dir, { recursive: true }).catch(() => { })
}

export async function mutate(name, fallback, fn) {
  const data = await readJson(name, fallback)
  const result = await fn(data)
  await writeJson(name, data)
  return result
}
