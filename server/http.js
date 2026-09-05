import { sendJson, sendError } from '../http.js'

export const sendJson = (response, status, payload) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(payload))
}

export const sendError = (response, status, message) => sendJson(response, status, { error: message })

export const notFound = (response) => sendError(response, 404, 'Not found')
