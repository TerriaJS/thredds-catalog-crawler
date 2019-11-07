import parser from 'fast-xml-parser'

export default class Requestor {

    constructor (urlParser) {
        this.parseUrl = urlParser
    }

    async getData (url) {
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
