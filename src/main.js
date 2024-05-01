import Catalog from './Catalog.js'

export default async function threddsCatalogCrawler (url, requestor) {
    const catalog = new Catalog(url, null, null, requestor)
    await catalog._loadCatalog()
    return catalog
}
