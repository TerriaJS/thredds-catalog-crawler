import Dataset from './Dataset'
import Service from './Service'

export default class Catalog {

    constructor (catalogUrl, catalogJson, parentCatalog, requestor) {

        this.url = catalogUrl
        this.name = catalogJson !== null ? catalogJson.$name : null
        this.title = catalogJson !== null ? catalogJson['$xlink:title'] : null
        this.id = catalogJson !== null ? catalogJson.$ID : null
        this.isLoaded = false
        this.datasets = []
        this.catalogs = []
        this.services = {}
        this.parentCatalog = parentCatalog

        this._catalogJson = catalogJson
        this._requestor = requestor
        this._urlObj = requestor.parseUrl(this.url)

        this._catalogBaseUrl = this.url.replace('catalog.xml', '')
        this._rootUrl = `${this._urlObj.protocol}//${this._urlObj.host}`
    }

    get hasDatasets () {
        return 'dataset' in this._catalogJson
    }

    get hasNestedCatalogs () {
        return 'catalogRef' in this._catalogJson
    }

    get supportsWms () {
        return 'wms' in this.services
    }

    get wmsBase () {
        if (!this.supportsWms) return null
        return `${this._rootUrl}${this.services.wms.baseUrl}`
    }

    async _loadCatalog () {
        this._catalogJson = await this._requestor.getData(this.url)
        this.isLoaded = true
        await this._processCatalog()
    }

    async _processCatalog () {
        const json = this._catalogJson
        if (this.name === null || this.name === '') this.name = json.$name
        if (this.title === null || this.title === '') this.title = json['$xlink:title']
        if (this.id === null) this.id = json.ID

        if (json.dataset) {
            if (!Array.isArray(json.dataset)) json.dataset = [json.dataset]
            for (var i = 0; i < json.dataset.length; i++) {
                const ds = new Dataset(json.dataset[i], this)
                await ds.getNestedData()
                this.datasets.push(ds)
            }
        }

        if (json.service) {
            this._getServicesRecursively(json.service)
        }

        if (json.catalogRef) {
            if (!Array.isArray(json.catalogRef)) json.catalogRef = [json.catalogRef]
            for (let i = 0; i < json.catalogRef.length; i++) {
                const url = this._cleanUrl(json.catalogRef[i]['$xlink:href'])
                try {
                    const ci = new Catalog(url, json.catalogRef[i], this, this._requestor)
                    this.catalogs.push(ci)
                } catch (err) {
                    console.error(`
                        Couldn't create catalog in catalog: ${url}
                        Parent was: ${this.url}
                        ${err}`
                    )
                }
            }
        }
    }

    async loadAllNestedCatalogs () {
        for (let i = 0; i < this.catalogs.length; i++) {
            const catalog = this.catalogs[i]
            try {
                await catalog._loadCatalog()
                await catalog.loadAllNestedCatalogs()
            } catch (err) {
                console.error(`
                    Couldn't create catalog in catalog: ${catalog.url}
                    Parent was: ${this.url}
                    ${err}`
                )
            }
        }
    }

    async loadNestedCatalogById (id) {
        let catalogFound = false
        for (let i = 0; i < this.catalogs.length; i++) {
            const catalog = this.catalogs[i]
            if (catalog.id !== id) continue
            catalogFound = true
            try {
                await catalog._loadCatalog()
                return catalog
            } catch (err) {
                console.error(`
                    Couldn't create catalog in catalog: ${catalog.url}
                    Parent was: ${this.url}
                    ${err}`
                )
            }
        }
        if (!catalogFound) {
            throw new Error(`Could not find catalog using id: ${id}`)
        }
    }

    // Services can be nested so crawl recurssively.
    // This isn't ideal as theoretically a dataset might
    // have access to one set of services but not another,
    // eg a set of service might provide WMS access, while another set don't
    // This is part of the metadata available in the xml but it's fiddily
    _getServicesRecursively (serviceInfo) {
        if (Array.isArray(serviceInfo)) serviceInfo = serviceInfo[0]
        for (let i = 0; i < serviceInfo.service.length; i++) {
            const service = serviceInfo.service[i]
            if ('service' in service) this._getServicesRecursively(service)
            else {
                const srv = new Service(service)
                this.services[srv.name] = srv
            }
        }
    }

    // Ay ya yai - THREDDS url references are the worst
    // A root catalog might be https://climate-services.it.csiro.au/thredds/catalog.xml
    //
    // And it might have       xlink:href="/thredds/catalog/data/nrm_ts/catalog.xml"
    // which should go to      https://climate-services.it.csiro.au/thredds/catalog/data/dynamic/catalog.xml
    //
    // And it also might have  xlink:href="aggregation/scaled_seasonal_timeseries.xml"
    // which should go to      https://climate-services.it.csiro.au/thredds/aggregation/scaled_seasonal_timeseries.xml
    _cleanUrl (url) {
        // If the url is absolute go directly to it
        if (url.indexOf('://') >= 0) return url

        // Sometimes urls seems to extend from the current catalog
        if (url.indexOf('thredds') === -1) {
            return `${this._catalogBaseUrl}/${url}`
        }

        // Sometimes the url reference seems to reference the root of the thredds server
        return `${this._rootUrl}${url}`
    }

    getAllChildDatasets () {
        let ds = []
        for (var i = 0; i < this.catalogs.length; i++) {
            ds = ds.concat(this.catalogs[i].getAllChildDatasets())
        }
        for (let i = 0; i < this.datasets.length; i++) {
            if (this.datasets[i].isParentDataset) {
                for (var ii = 0; ii < this.datasets[i].datasets.length; ii++) {
                    ds.push(this.datasets[i].datasets[ii])
                }
            } else {
                ds.push(this.datasets[i])
            }
        }
        return ds
    }

}
