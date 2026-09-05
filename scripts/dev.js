/* global process */
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const vite = resolve('node_modules', 'vite', 'bin', 'vite.js')
const apiUrl = 'http://127.0.0.1:8787/api/content'
let apiProcess
let viteProcess
let stopping = false

const stop = (code = 0) => {
  if (stopping) return
  stopping = true
  apiProcess?.kill()
  viteProcess?.kill()
  process.exitCode = code
}

const startVite = () => {
  if (viteProcess) return
  viteProcess = spawn(process.execPath, [vite, ...process.argv.slice(2)], { stdio: 'inherit' })
  viteProcess.on('exit', (code) => stop(code || 0))
}

const apiIsRunning = async () => {
  try { return (await fetch(apiUrl)).ok } catch { return false }
}

const startApi = () => {
  apiProcess = spawn(process.execPath, ['server.js'], { stdio: ['inherit', 'pipe', 'pipe'] })
  apiProcess.stdout.on('data', (output) => {
    process.stdout.write(output)
    if (output.toString().includes('Content API running')) startVite()
  })
  apiProcess.stderr.on('data', (output) => process.stderr.write(output))
  apiProcess.on('exit', (code) => stop(code || 1))
}

if (await apiIsRunning()) {
  console.log('Content API already running at http://localhost:8787')
  startVite()
} else startApi()

process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
