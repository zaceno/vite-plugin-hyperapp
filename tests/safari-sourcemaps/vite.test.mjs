import assert from 'node:assert/strict'
import { test } from 'vitest'
import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'
import hyperapp from '../../dist/index.js'

test('Safari can request the external TSX map; Chrome still gets the inline map', async () => {
  const server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)),
    configFile: false,
    plugins: [hyperapp({ safariExternalSourcemaps: true })],
    server: { port: 0, hmr: false },
  })
  try {
    await server.listen()
    const origin = `http://localhost:${server.httpServer.address().port}`
    const path = '/fixtures/view.tsx'
    const safariAgent = 'Mozilla/5.0 AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15'
    const safari = await fetch(origin + path, { headers: { 'user-agent': safariAgent } })
    assert.equal(safari.status, 200)
    assert.match(await safari.text(), new RegExp(`sourceMappingURL=${path}\\.map$`))

    const mapResponse = await fetch(origin + path + '.map', { headers: { 'user-agent': safariAgent } })
    assert.equal(mapResponse.status, 200)
    const map = await mapResponse.json()
    assert.deepEqual(map.sources, ['view.tsx'])
    assert.match(map.sourcesContent[0], /<button/)

    const chrome = await fetch(origin + path, { headers: { 'user-agent': 'Chrome/129.0 Safari/537.36' } })
    assert.match(await chrome.text(), /sourceMappingURL=data:application\/json;base64,/)
  } finally {
    await server.close()
  }
})
