import test from 'ava'
import 'isomorphic-fetch'
import { startServer } from './xmlServer'
import threddsCatalogCrawler from '../src/entryNode'

let catalog = null

test.before(async t => {
    t.context.server = await startServer()
    catalog = await threddsCatalogCrawler(`${t.context.server}/thredds/catalog.xml`)
});

test('Parent Catalog does not yet all have all children', function (t) {
    t.is(catalog.datasets.length, 1)
    t.is(catalog.getAllChildDatasets().length, 1)
    t.is(catalog.catalogs[0].isLoaded, false)
    t.is(catalog.catalogs[1].isLoaded, false)
})

test('Catalog can retrieve child by ID', async function (t) {
    t.is(catalog.catalogs.length, 2)
    const newCatalog = await catalog.getNestedCatalogById('subCatalog2')
    t.is(newCatalog.title, 'Some Catalog 2')
    t.is(newCatalog.datasets.length, 1)
    t.is(newCatalog.catalogs.length, 1)

    // We've loaded only a single catalog
    t.is(catalog.catalogs[0].isLoaded, false)
    t.is(catalog.catalogs[1].isLoaded, true)
    t.is(newCatalog.isLoaded, true)

    // We've not loaded the child catalogs
    t.is(newCatalog.catalogs[0].isLoaded, false)
    t.is(catalog.getAllChildDatasets().length, 2)
})

test('Check that catalog throws errors', async function (t) {
    await t.throwsAsync(async () => {
        await catalog.getNestedCatalogById('asfbjd');
    }, {
        instanceOf: Error,
        message: 'Could not find catalog using id: asfbjd'
    });
})
