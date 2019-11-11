import test from 'ava'
import 'isomorphic-fetch'
import { startServer } from './xmlServer'
import { startProxy } from './proxyServer'

import threddsCatalogCrawler from '../src/entryNode'

let catalog = null
let dataset = null

test.before(async t => {
    t.context.proxy = await startProxy()
    t.context.server = await startServer()
    catalog = await threddsCatalogCrawler(`${t.context.server}/thredds/catalog.xml`, {
        proxy: `${t.context.proxy}`
    })
    await catalog.getNestedCatalogData()
    dataset = catalog.datasets[0]
});

test('Catalog has correct properties', function (t) {
    t.is(catalog.url, `${t.context.server}/thredds/catalog.xml`)
    t.is(dataset.wmsUrl, `${t.context.server}/thredds/wms/fx3/gbr4/gbr4_simple_2016-06.nc?service=WMS&version=1.3.0&request=GetCapabilities`)
})
