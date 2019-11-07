# thredds-catalog-crawler
A package for crawling THREDDS catalogs, including nested catalogs.

## Install
````
npm install thredds-catalog-crawler --save
````

## Basic usage
**Using async/await & modules**
````
import threddsCrawler from 'thredds-catalog-crawler'

async function getDatasets() {
    const catalog = await threddsCrawler('http://something/thredds/catalog/my/catalog.xml')
    await catalog.getNestedCatalogData()
    const datasets = catalog.getAllChildDatasets()
}
getDatasets()
````

**Using traditional promises & modules**
````
const threddsCrawler = require('thredds-catalog-crawler')

threddsCrawler('http://something/thredds/catalog/my/catalog.xml')
.then(function (catalog) {
    catalog.getNestedCatalogData()
})
````

### Dependencies
This package uses the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). If you're using this library in NodeJS you'll need a fetch polyfill like [isomorphic-fetch](https://www.npmjs.com/package/isomorphic-fetch) or if you want to support older browsers we'd suggest [unfetch](https://github.com/developit/unfetch).
You may also need a [URL API](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL) polyfill such as [url-polyfill](https://www.npmjs.com/package/url-polyfill) for older browsers.
````
import 'isomorphic-fetch'
import 'url-polyfill'
import threddsCrawler from 'thredds-catalog-crawler'
````


## API

### Catalog
A `Catalog` represents the root object in a THREDDS heirarchy. Catalogs can contain datasets, as well as references to other catalogs.

#### Properties
| Property      | Type      | Description   |
| ------------- | --------- | ------------- |
| url           | String    | Url of the catalog |
| name          | String    | Name of the catalog |
| datasets      | Array     | An array of datasets found in the catalog |
| catalogs      | Array     | An array of nested catalogs found in the catalog |
| services      | Object    | An object containing the available services for a catalog, organised by service type | 
| hasDatasets   | Boolean   | Indicates whether the catalog contains datasets directly |
| hasNestedCatalogs   | Boolean   | Indicates whether the catalog contains nested catalogs |
| wmsBase       | String    | The base url for a WMS service. If no WMS support is available then null. |
| supportsWms   | Boolean   | Does a catalog have a WMS service for datasets |

#### Methods
| Method                | Returns         | Description  |
| --------------------- | --------------- | ------------ |
| getAllChildDatasets   | Array[Dataset1, Dataset2...] | Returns a flattened array of datasets from all nested catalogs |
| getNestedCatalogData  | N/A             | Crawls nested catalogs - used to populate the `catalogs`property |


### Dataset
A `Dataset` can contain datasets, as well as references to other catalogs.

#### Properties
| Property          | Type           | Description   |
| ----------------- | -------------- | ------------- |
| id                | String         | An id of the dataset |
| name              | String         | Name of the dataset |
| parent            | Object         | A catalog or another dataset |
| urlPath           | String         | Partial url path of the dataset |
| isParentDataset   | Boolean        | Indicates whether this dataset contains other datasets |
| datasets          | Array[Dataset] | An array of nested datasets |
| wmsUrl            | String         | A url for the `GetCapabilities` endpoint for the dataset. Constructed from the dataset and its parent catalog item |
| parentCatalog     | Catalog        | A reference to the datasets parent catalog |
| supportsWms       | Boolean        | Does this dataset have a WMS available |


