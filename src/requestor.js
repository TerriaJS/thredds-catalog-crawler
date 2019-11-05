import parser from 'fast-xml-parser'

export async function getData (url) {
    const xmlResponse = await fetch(url)
    const responseXml = await xmlResponse.text()
    return parseStringSync(responseXml).catalog
};

// Handy to keep this seperate for testing purposes
export function parseStringSync (str) {
    return parser.parse(str, {
        attributeNamePrefix: '$',
        ignoreAttributes: false
    })
}
