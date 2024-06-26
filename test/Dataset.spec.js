import test from 'ava'
import 'isomorphic-fetch'
import { startServer } from './xmlServer.js'
import threddsCatalogCrawler from '../src/entryNode.js'

let catalog = null
let dataset = null

test.before(async t => {
    t.context.server = await startServer()
    catalog = await threddsCatalogCrawler(`${t.context.server}/thredds/catalog.xml`)
    await catalog.loadAllNestedCatalogs()
    dataset = catalog.datasets[0]
});

test.after(t => t.context.server.stop());

test('Dataset has correct properties', function (t) {
    t.is(dataset.name, 'eReefs GBR4 SHOC Model v1.85 Results for 2016-06')
    t.is(dataset.id, 'fx3-gbr4/gbr4_simple_2016-06.nc')
    t.is(dataset.urlPath, 'fx3/gbr4/gbr4_simple_2016-06.nc')
    t.not(dataset.metadata, undefined);
    t.not(dataset.metadata, null);
    t.notDeepEqual(dataset.metadata, {});
})

test('Dataset has correct parent', function (t) {
    t.is(dataset.parent, catalog)
})

test('Get Dataset WMS', function (t) {
    t.is(dataset.wmsUrl, `${t.context.server}/thredds/wms/fx3/gbr4/gbr4_simple_2016-06.nc?service=WMS&version=1.3.0&request=GetCapabilities`)
})
