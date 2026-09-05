/**
 * Validation helpers — small declarative validators used by API routes.
 */
export class ValidationError extends Error {
  constructor(message, status = 422) {
    super(message)
    this.status = status
  }
}

export const requireString = (value, field, { min = 1, max = Infinity } = {}) => {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) {
    throw new ValidationError(`${field} must be a string of ${min}–${max} characters`)
  }
  return value.trim()
}

export const requireEmail = (value, field = 'email') => {
  const email = requireString(value, field, { min: 5, max: 254 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError(`${field} is not a valid email`)
  return email.toLowerCase()
}

export const optionalString = (value, field, max = 5000) => {
  if (value === undefined || value === null) return ''
  return requireString(String(value), field, { min: 0, max })
}

export const requireOneOf = (value, field, options) => {
  if (!options.includes(value)) throw new ValidationError(`${field} must be one of: ${options.join(', ')}`)
  return value
}

export const requireArray = (value, field, { maxItems = 200, itemMax = 500 } = {}) => {
  if (!Array.isArray(value)) throw new ValidationError(`${field} must be an array`)
  if (value.length > maxItems) throw new ValidationError(`${field} may contain at most ${maxItems} items`)
  return value.map((item, index) => optionalString(item, `${field}[${index}]`, itemMax))
}

export const requireDate = (value, field) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new ValidationError(`${field} must be a valid date`)
  return date.toISOString()
}

export const stripTags = (value) => String(value).replace(/<[^>]*>/g, '')

/** Escape a string for safe interpolation into HTML. */
export const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
