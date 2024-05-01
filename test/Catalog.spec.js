import test from 'ava'
import 'isomorphic-fetch'
import { startServer } from './xmlServer.js'
import threddsCatalogCrawler from '../src/entryNode.js'

let catalog = null

test.before(async t => {
    t.context.server = await startServer()
    catalog = await threddsCatalogCrawler(`${t.context.server}/thredds/catalog.xml`)
    await catalog.loadAllNestedCatalogs()
});

test.after(t => t.context.server.stop());

test('Catalog has correct properties', function (t) {
    t.is(catalog.url, `${t.context.server}/thredds/catalog.xml`)
    t.is(catalog.name, 'My Parent Catalog')
    t.notDeepEqual(catalog.metadata, {});
})

test('Catalog has correct datasets', function (t) {
    t.is(catalog.datasets.length, 1)
})

test('Catalog has correct catalogs', function (t) {
    t.is(catalog.catalogs.length, 2)
})

test('Catalog has correct services', function (t) {
    t.is(Object.keys(catalog.services).length, 7)
    t.is(catalog.services.wms.name, 'wms')
    t.is(catalog.services.wms.type, 'WMS')
    t.is(catalog.services.wms.baseUrl, '/thredds/wms/')
    t.is(catalog.supportsWms, true)
    t.is(catalog.wmsBase, `${t.context.server}/thredds/wms/`)
})

test('Dataset via Catalog', function (t) {
    t.is(catalog.datasets[0].name, 'eReefs GBR4 SHOC Model v1.85 Results for 2016-06')
    t.is(catalog.datasets[0].id, 'fx3-gbr4/gbr4_simple_2016-06.nc')
    t.is(catalog.datasets[0].urlPath, 'fx3/gbr4/gbr4_simple_2016-06.nc')
    t.is(catalog.datasets[0].parent, catalog)
})
