import Catalog from './Catalog'

export default async function threddsCatalogCrawler (url, requestor) {
    const catalogJson = await requestor.getData(url)
    const catalog = new Catalog(url, catalogJson, null, requestor)
    await catalog.processCatalog()
    return catalog
}
