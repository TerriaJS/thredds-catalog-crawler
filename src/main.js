import { getData } from './requestor'
import Catalog from './Catalog'

export default async function threddsCatalogCrawler (url) {
    const catalogJson = await getData(url)
    const catalog = new Catalog(url, catalogJson, null)
    await catalog.getCatalogData()
    return catalog
}
