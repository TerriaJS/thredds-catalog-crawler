import http from 'http'
import listen from 'test-listen'
import express from 'express'
import serveStatic from 'serve-static'
import path from 'path'
import { fileURLToPath } from 'url';

export async function startServer () {
    const app = express();
    const server = http.createServer(app);
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    app.use(serveStatic(dirname))
    const url = await listen(server);
    return { toString: () => url, stop: () => server.close() };
}
