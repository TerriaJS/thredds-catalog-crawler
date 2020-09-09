
export default class Requestor {

    constructor (urlParser, options, domparser) {
        this.parseUrl = urlParser
        this.proxy = options.proxy ? options.proxy : null
        this.DOMParser = domparser
    }

    async getData (url) {
        url = this.proxy ? `${this.proxy}${url}` : url
        const xmlResponse = await fetch(url)
        const responseXml = await xmlResponse.text()
        const json = this.parseStringSync(responseXml)
        return json
    }

    parseStringSync (str) {
        return parseXml(str, false, this.DOMParser)
    }

}

function parseXml(xml, extended, DomParser) {
    if (!xml) return {};

    function parseXML(node, simple) {
      if (!node) return null;
      var txt = "",
        obj = null,
        att = null;
      var nt = node.nodeType,
        nn = jsVar(node.localName || node.nodeName);
      var nv = node.text || node.nodeValue || ""; //if(window.console) console.log(['x2j',nn,nt,nv.length+' bytes']);
      /*DBG*/ if (node.childNodes) {
        if (node.childNodes.length > 0) {
          /*DBG*/ //if(window.console) console.log(['x2j',nn,'CHILDREN',node.childNodes]);
          for (var n = 0; n < node.childNodes.length; ++n) {
            var cn = node.childNodes[n];
            var cnt = cn.nodeType,
              cnn = jsVar(cn.localName || cn.nodeName);
            var cnv = cn.text || cn.nodeValue || ""; //if(window.console) console.log(['x2j',nn,'node>a',cnn,cnt,cnv]);
            /*DBG*/ if (cnt == 8) {
              /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>b',cnn,'COMMENT (ignore)']);
              continue; // ignore comment node
            } else if (cnt == 3 || cnt == 4 || !cnn) {
              // ignore white-space in between tags
              if (cnv.match(/^\s+$/)) {
                /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>c',cnn,'WHITE-SPACE (ignore)']);
                continue;
              } //if(window.console) console.log(['x2j',nn,'node>d',cnn,'TEXT']);
              /*DBG*/ txt += cnv.replace(/^\s+/, "").replace(/\s+$/, "");
              // make sure we ditch trailing spaces from markup
            } else {
              /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>e',cnn,'OBJECT']);
              obj = obj || {};
              if (obj[cnn]) {
                /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>f',cnn,'ARRAY']);
  
                // http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
                if (!obj[cnn].length) obj[cnn] = myArr(obj[cnn]);
                obj[cnn] = myArr(obj[cnn]);
  
                obj[cnn][obj[cnn].length] = parseXML(cn, true /* simple */);
                obj[cnn].length = obj[cnn].length;
              } else {
                /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>g',cnn,'dig deeper...']);
                obj[cnn] = parseXML(cn);
              }
            }
          }
        } //node.childNodes.length>0
      } //node.childNodes
      if (node.attributes) {
        if (node.attributes.length > 0) {
          /*DBG*/ //if(window.console) console.log(['x2j',nn,'ATTRIBUTES',node.attributes])
          att = {};
          obj = obj || {};
          for (var a = 0; a < node.attributes.length; ++a) {
            var at = node.attributes[a];
            var atn = jsVar(at.name),
              atv = at.value;
            att[atn] = atv;
            if (obj[atn]) {
              /*DBG*/ //if(window.console) console.log(['x2j',nn,'attr>',atn,'ARRAY']);
  
              // http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
              //if(!obj[atn].length) obj[atn] = myArr(obj[atn]);//[ obj[ atn ] ];
              obj[cnn] = myArr(obj[cnn]);
  
              obj[atn][obj[atn].length] = atv;
              obj[atn].length = obj[atn].length;
            } else {
              /*DBG*/ //if(window.console) console.log(['x2j',nn,'attr>',atn,'TEXT']);
              obj[atn] = atv;
            }
          }
          //obj['attributes'] = att;
        } //node.attributes.length>0
      } //node.attributes
      if (obj) {
        var newObj = txt != "" ? new String(txt) : {};
        for (var prop in obj) {
          if (obj.hasOwnProperty(prop)) {
            newObj[prop] = obj[prop];
          }
        }
        obj = newObj;
        //txt = (obj.text) ? (typeof(obj.text)=='object' ? obj.text : [obj.text || '']).concat([txt]) : txt;
        txt = obj.text ? [obj.text || ""].concat([txt]) : txt;
        if (txt) obj.text = txt;
        txt = "";
      }
      var out = obj || txt;
      //console.log([extended, simple, out]);
      if (extended) {
        if (txt) out = {}; //new String(out);
        txt = out.text || txt || "";
        if (txt) out.text = txt;
        if (!simple) out = myArr(out);
      }
      return out;
    }

    var jsVar = function(s) {
        return String(s || '').replace(/-/g, '_');
    };

    var myArr = function(o) {
      // http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
      //if(!o.length) o = [ o ]; o.length=o.length;
      if (!Array.isArray(o)) o = [o];
      o.length = o.length;
  
      // here is where you can attach additional functionality, such as searching and sorting...
      return o;
    };

    if (typeof xml === 'string') {
        const parser = new DomParser()
        xml = parser.parseFromString(xml, 'text/xml')
    };

    if (!xml.nodeType) return;
    if (xml.nodeType === 3 || xml.nodeType === 4) return xml.nodeValue;

    var root = xml.nodeType === 9 ? xml.documentElement : xml;

    var out = parseXML(root, true);

    xml = null;
    root = null;

    return out;
}
