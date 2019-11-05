import http from 'http'
import listen from 'test-listen'
import express from 'express'
import serveStatic from 'serve-static'
import path from 'path'

export async function startServer () {
    var app = express()
    app.use(serveStatic(path.join(__dirname)))
    const url = await listen(http.createServer(app))
    return url
}
