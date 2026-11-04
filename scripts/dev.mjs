import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const viteEntrypoint = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js')
const services = []
let stopping = false

function stopServices(exitCode = 0) {
  if (stopping) return
  stopping = true
  for (const service of services) {
    if (!service.killed) service.kill()
  }
  process.exitCode = exitCode
}

function start(label, command, args) {
  const service = spawn(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    windowsHide: true,
  })
  services.push(service)
  service.on('error', (error) => {
    console.error(`[${label}] ${error.message}`)
    stopServices(1)
  })
  service.on('exit', (code) => {
    if (!stopping) {
      console.error(`[${label}] stopped${code === 0 ? '' : ` with exit code ${code}`}`)
      stopServices(code || 1)
    }
  })
  return service
}

start('PHP API', 'php', ['-S', '127.0.0.1:8000', '-t', path.join(projectRoot, 'backend', 'public')])
start('Vite', process.execPath, [viteEntrypoint])

process.on('SIGINT', () => stopServices(0))
process.on('SIGTERM', () => stopServices(0))
