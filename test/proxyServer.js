import corsProxy from 'cors-anywhere'
import listen from 'test-listen'

export async function startProxy () {
    const cp = corsProxy.createServer({
        originWhitelist: [], // Allow all origins
        requireHeader: [],
        removeHeaders: []
    })
    const url = await listen(cp);
    return { toString: () => url, stop: () => cp.close() }
}
