import Catalog from './Catalog'

export default class Dataset {

    constructor (datasetJson, parent) {
        this.parent = parent
        this.id = datasetJson.$ID
        this.name = datasetJson.$name
        this.urlPath = datasetJson.$urlPath ? datasetJson.$urlPath : null

        this.dataType = datasetJson.dataType ? datasetJson.dataType : null
        this.dataFormat = datasetJson.dataFormat ? datasetJson.dataFormat : null

        if (datasetJson.dataSize) {
            this.dataSize = {
                size: datasetJson.dataSize['#text'],
                unit: datasetJson.dataSize.$units
            }
        } else {
            this.dataSize = null
        }

        if (datasetJson.date) {
            this.date = {
                size: datasetJson.date['#text'],
                type: datasetJson.date.$type
            }
        } else {
            this.date = null
        }

        this.isParentDataset = this.dataSize === null
        this.datasets = []
        this._datasetJson = datasetJson

        this.catalogs = []
    }

    async getNestedData () {
        const json = this._datasetJson
        if (json.dataset) {
            if (!Array.isArray(json.dataset)) json.dataset = [json.dataset]
            for (let i = 0; i < json.dataset.length; i++) {
                const ds = new Dataset(json.dataset[i], this)
                await ds.getNestedData()
                this.datasets.push(ds)
            }
        }

        if (json.catalogRef) {
            if (!Array.isArray(json.catalogRef)) json.catalogRef = [json.catalogRef]
            for (let i = 0; i < json.catalogRef.length; i++) {
                const url = this._cleanUrl(json.catalogRef[i]['$xlink:href'])
                try {
                    const ci = new Catalog(url, json.catalogRef[i], this, this.parent._requestor)
                    await ci.loadCatalog()
                    await ci.getAllNestedCatalogs()
                    this.catalogs.push(ci)
                } catch (err) {
                    console.error(`Couldn't create catalog within dataset:
                        Dataset URL: ${url}
                        ${err}`
                    )
                }
            }
        }
    }

    _cleanUrl (url) {
        // If the url is absolute return it as is...
        if (url.indexOf('://') >= 0) return url

        return `${this.parentCatalog._catalogBaseUrl}${url}`
    }

    get wmsUrl () {
        if (!this.supportsWms) return null
        return `${this.parentCatalog.wmsBase}${this.urlPath}?service=WMS&version=1.3.0&request=GetCapabilities`
    }

    get parentCatalog () {
        const p = this.parent
        if (p.isParentDataset) {
            return p.parent
        }
        return p
    }

    get supportsWms () {
        if (this.isParentDataset) return false
        return this.parentCatalog.supportsWms
    }

}
