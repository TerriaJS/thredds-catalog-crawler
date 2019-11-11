import parser from 'fast-xml-parser'

export default class Requestor {

    constructor (urlParser, options) {
        this.parseUrl = urlParser
        this.proxy = options.proxy ? options.proxy : null
    }

    async getData (url) {
        url = this.proxy ? `${this.proxy}${url}` : url
        const xmlResponse = await fetch(url)
        const responseXml = await xmlResponse.text()
        return this.parseStringSync(responseXml).catalog
    }

    parseStringSync (str) {
        return parser.parse(str, {
            attributeNamePrefix: '$',
            ignoreAttributes: false
        })
    }

}
