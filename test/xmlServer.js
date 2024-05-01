import http from 'http'
import listen from 'test-listen'
import express from 'express'
import serveStatic from 'serve-static'
import path from 'path'

export async function startServer () {
    var app = express();
    const server = http.createServer(app);
    app.use(serveStatic(path.join(import.meta.dirname)))
    const url = await listen(server);
    return { toString: () => url, stop: () => server.close() };
}
