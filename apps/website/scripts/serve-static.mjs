import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..', 'dist')

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function parseArgs(argv) {
  let host = '0.0.0.0'
  let port = 3001

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    const next = argv[index + 1]

    if ((argument === '--host' || argument === '--hostname') && next) {
      host = next
      index += 1
      continue
    }

    if (argument === '--port' && next) {
      const parsed = Number(next)
      if (Number.isFinite(parsed) && parsed > 0) {
        port = parsed
      }
      index += 1
    }
  }

  return { host, port }
}

function safeJoin(basePath, requestPath) {
  const normalized = path.normalize(requestPath).replace(/^(\.\.(\/|\\|$))+/, '')
  return path.join(basePath, normalized)
}

function resolveFilePath(urlPathname) {
  const decodedPath = decodeURIComponent(urlPathname)
  const absolutePath = safeJoin(rootDir, decodedPath)

  if (existsSync(absolutePath) && statSync(absolutePath).isFile()) {
    return { type: 'file', filePath: absolutePath }
  }

  if (existsSync(absolutePath) && statSync(absolutePath).isDirectory()) {
    return decodedPath.endsWith('/')
      ? { type: 'file', filePath: path.join(absolutePath, 'index.html') }
      : { type: 'redirect', location: `${decodedPath}/` }
  }

  const htmlPath = safeJoin(rootDir, `${decodedPath}.html`)
  if (existsSync(htmlPath) && statSync(htmlPath).isFile()) {
    return { type: 'file', filePath: htmlPath }
  }

  const directoryIndexPath = safeJoin(rootDir, decodedPath.replace(/\/?$/, '/index.html'))
  if (existsSync(directoryIndexPath) && statSync(directoryIndexPath).isFile()) {
    return decodedPath.endsWith('/')
      ? { type: 'file', filePath: directoryIndexPath }
      : { type: 'redirect', location: `${decodedPath}/` }
  }

  return null
}

async function respondWithFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase()
  const contentType = mimeTypes[extension] ?? 'application/octet-stream'
  const file = await readFile(filePath)
  response.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
  })
  response.end(file)
}

const { host, port } = parseArgs(process.argv.slice(2))

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
    const resolved = resolveFilePath(requestUrl.pathname)

    if (!resolved) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('Not found')
      return
    }

    if (resolved.type === 'redirect') {
      const search = requestUrl.search || ''
      response.writeHead(308, { Location: `${resolved.location}${search}` })
      response.end()
      return
    }

    await respondWithFile(response, resolved.filePath)
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end(`Offline static server error: ${error instanceof Error ? error.message : String(error)}`)
  }
})

server.listen(port, host, () => {
  console.log(`Pulse website static export available at http://localhost:${port}`)
  console.log(`Serving: ${rootDir}`)
})
