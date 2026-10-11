import type { Plugin } from 'vite'

// Safari Web Inspector needs an external map to show the original TSX source.
// Vite already serves .tsx.map requests; only the JS response needs changing.
export function safariExternalSourcemapsPlugin(): Plugin {
  return {
    name: 'local:safari-external-sourcemaps',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const agent = req.headers['user-agent'] ?? ''
        if (!/Safari\//.test(agent) || /Chrome\/|Chromium\/|CriOS\/|Edg\/|OPR\//.test(agent)) {
          return next()
        }

        const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
        if (!url.pathname.endsWith('.tsx')) return next()

        delete req.headers['if-none-match']
        const end = res.end.bind(res)
        const finish = (chunk?: string | Uint8Array, encoding?: BufferEncoding, callback?: () => void) =>
          encoding ? end(chunk, encoding, callback) : callback ? end(chunk, callback) : end(chunk)
        res.end = ((chunk?: string | Uint8Array, encoding?: BufferEncoding, callback?: () => void) => {
          if (res.statusCode !== 200 || typeof chunk !== 'string') {
            return finish(chunk, encoding, callback)
          }
          const rewritten = chunk.replace(
            /\/\/# sourceMappingURL=data:application\/json;base64,[A-Za-z0-9+/=]+\s*$/,
            `//# sourceMappingURL=${url.pathname}.map${url.search}`,
          )
          if (rewritten !== chunk) res.removeHeader('ETag')
          return finish(rewritten, encoding, callback)
        }) as typeof res.end
        next()
      })
    },
  }
}
