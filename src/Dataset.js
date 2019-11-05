export default class Dataset {

    constructor (datasetJson, parent) {
        this.parent = parent
        this.id = datasetJson.$ID
        this.name = datasetJson.$name
        this.urlPath = datasetJson.$urlPath

        this.dataType = datasetJson.dataType
        this.dataFormat = datasetJson.dataFormat

        this.dataSize = {
            size: datasetJson.dataSize['#text'],
            unit: datasetJson.dataSize.$units
        }

        this.date = {
            size: datasetJson.date['#text'],
            type: datasetJson.date.$type
        }

        this.isParentDataset = this.urlPath === undefined
        this.datasets = []
        this._datasetJson = datasetJson
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
    }

    get wmsUrl () {
        if (!this.supportsWms) return null
        return `${this.parentCatalog.wmsBase}${this.urlPath}?service=WMS&version=1.3.0&request=GetCapabilities`
    }

    get parentCatalog () {
        if (this.parent.isParentDataset) {
            return this.parent.parent
        }
        return this.parent
    }

    get supportsWms () {
        if (this.isParentDataset) return false
        return this.parentCatalog.supportsWms
    }

}
