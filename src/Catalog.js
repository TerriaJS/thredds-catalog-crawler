import { getData } from './requestor'
import { parseUrl } from './urlParsing'
import Dataset from './Dataset'
import Service from './Service'

// http://dapds00.nci.org.au/thredds/catalog/fx3/gbr4/catalog.xml
export default class Catalog {

    constructor (catalogUrl, catalogJson, parentCatalog) {

        this.url = catalogUrl
        this.name = catalogJson.$name ? catalogJson.$name : null
        this.datasets = []
        this.catalogs = []
        this.services = {}
        this.parentCatalog = parentCatalog
        this._catalogJson = catalogJson

        this._urlObj = parseUrl(this.url)

        this._path = this._urlObj.pathname.split('/').filter(p => p !== '')

        this._rootUrl = `${this._urlObj.protocol}//${this._urlObj.host}`
    }

    async getCatalogData () {
        const json = this._catalogJson
        this.name = json.$name ? json.$name : json['$xlink:title']

        if (json.dataset) {
            if (!Array.isArray(json.dataset)) json.dataset = [json.dataset]
            for (var i = 0; i < json.dataset.length; i++) {
                const ds = new Dataset(json.dataset[i], this)
                await ds.getNestedData()
                this.datasets.push(ds)
            }
        }

        if (json.service) {
            let serviceInfo = json.service
            if (Array.isArray(serviceInfo)) serviceInfo = serviceInfo[0]
            for (let i = 0; i < serviceInfo.service.length; i++) {
                const srv = new Service(serviceInfo.service[i])
                this.services[srv.name] = srv
            }
        }

        if (json.catalogRef) {
            if (!Array.isArray(json.catalogRef)) json.catalogRef = [json.catalogRef]
            for (let i = 0; i < json.catalogRef.length; i++) {
                const url = this._cleanUrl(json.catalogRef[i]['$xlink:href'])
                try {
                    const catalogJson = await getData(url)
                    const ci = new Catalog(url, catalogJson, this)
                    await ci.getCatalogData()
                    this.catalogs.push(ci)
                } catch (err) {
                    console.log('Couldnt get: ', url, err)
                }
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
        // If the url is absolute return it as is...
        if (url.indexOf('://') >= 0) return url

        // sometimes the url reference seems to be malformed...
        if (url.indexOf('thredds') === -1) {
            return `${this._rootUrl}/thredds/${url}`
        }
        // This ought to be the norm
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

    get supportsWms () {
        return 'wms' in this.services
    }

    get wmsBase () {
        if (!this.supportsWms) return null
        return `${this._rootUrl}${this.services.wms.baseUrl}`
    }

}
