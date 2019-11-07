import Dataset from './Dataset'
import Service from './Service'

export default class Catalog {

    constructor (catalogUrl, catalogJson, parentCatalog, requestor) {

        this.url = catalogUrl
        this.name = catalogJson.$name ? catalogJson.$name : null
        this.datasets = []
        this.catalogs = []
        this.services = {}
        this.parentCatalog = parentCatalog
        this._catalogJson = catalogJson

        this._requestor = requestor
        this._urlObj = requestor.parseUrl(this.url)

        // If the requests are being proxied in the browser there is potential
        // to muck up the WMS url construction
        if ((this.url.match(/:\//g)).length > 1) {
            const origUrlParts = this.url.split('://')
            this._unproxiedUrl = `${origUrlParts[0]}://${origUrlParts[2]}`
            this._unproxiedUrlObj = requestor.parseUrl(this._unproxiedUrl)
        } else {
            this._unproxiedUrlObj = this._urlObj
        }

        this._catalogBaseUrl = this.url.replace('catalog.xml', '')
        this._rootUrl = `${this._unproxiedUrlObj.protocol}//${this._unproxiedUrlObj.host}`
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

    async processCatalog () {
        const json = this._catalogJson

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
    }

    async getNestedCatalogData () {
        const json = this._catalogJson

        if (json.catalogRef) {
            if (!Array.isArray(json.catalogRef)) json.catalogRef = [json.catalogRef]
            for (let i = 0; i < json.catalogRef.length; i++) {
                const url = this._cleanUrl(json.catalogRef[i]['$xlink:href'])
                try {
                    const catalogJson = await this._requestor.getData(url)
                    const ci = new Catalog(url, catalogJson, this, this._requestor)
                    await ci.processCatalog()
                    await ci.getNestedCatalogData()
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
