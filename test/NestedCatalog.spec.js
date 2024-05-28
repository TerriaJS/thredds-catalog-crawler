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
    t.is(catalog.name, 'My Parent Catalog')
    t.is(catalog.catalogs.length, 2)
    t.is(catalog.datasets.length, 1)
})

test('Got nested catalogs', function (t) {
    t.is(catalog.catalogs[0].name, 'Catalog A')
    t.is(catalog.catalogs[1].name, 'Catalog B')

    t.is(catalog.catalogs[0].parentCatalog, catalog)
    t.is(catalog.catalogs[1].parentCatalog, catalog)
})

test('Got nested nested catalogs', function (t) {
    const catalogB = catalog.catalogs[1]
    t.is(catalogB.catalogs.length, 1)
    t.is(catalogB.catalogs[0].parentCatalog, catalogB)
})

test('Parent can crawl all nested for datasets', function (t) {
    t.is(catalog.getAllChildDatasets().length, 4)
})
