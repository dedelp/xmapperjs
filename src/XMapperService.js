import xmlBuilder from 'xmlbuilder'
import {DOMParser,DOMImplementation} from 'xmldom'
import xPath from 'xpath'

var ResponseTypes = {XML:'XML',JSON:'JSON',STRING:'STRING',NUMBER:'NUMBER',BOOLEAN:'BOOLEAN'}

const XMapperService = {
    ResponseTypes,
    traces:[],
    handleTrace: (trace,e) => {
		var path = []

		while(e && e.nodeName !== '#document')
		{
			var index = 0
			var sibling = e.previousSibling
			while(sibling && sibling.constructor.name == 'Element')
			{
				if(sibling.nodeName == e.nodeName) index++
				sibling = sibling.previousSibling
			}
			if(index > 0)
			{
				path.push(index)
			}
			if(index == 0)
			{
				sibling = e.nextSibling
				while(sibling && sibling.constructor.name == 'Element')
				{
					if(sibling.nodeName == e.nodeName)
					{
						path.push(0)
						break
					}
					sibling = sibling.nextSibling
				}
			}
			path.push(e.nodeName)
			e = e.parentNode
		}
        XMapperService.traces.push({trace,path})
    },
    jsonToXML:json => {
        if(typeof json !== 'object') {
            try {
                json = JSON.parse(json)
            } catch(e) {
                return json.toString()
            }
        }
        return xmlBuilder.create(json).end()
        
    },
    xmlToJson: xml => {
        if(typeof xml == 'string') xml = XMapperService.generateDom(xml)
        return xmlToJson(xml)
    },
    generateDom:input => {
        if(typeof input === 'object') {
            if(input.constructor.name === 'Document') return input
            input = XMapperService.jsonToXML(input)
        }
        return new DOMParser().parseFromString(input,"application/xml")
    },
    parseQuery:query => {
        return xPath.parse(query)
    },
    query:(dom,expr,type,variables,trace,multipart) => {
        if(dom == null) return null
        type = type || ResponseTypes.STRING
        expr = typeof expr === 'string' ? xPath.parse(expr) : expr
        if(Array.isArray(dom)) return XMapperService.queryEach(dom,expr,type,variables,trace,multipart)
        if(!multipart && trace) XMapperService.traces = []
        dom = XMapperService.generateDom(dom)
        var options = {node:dom,variables,functions:xpathFunctions}
		const result = !~[ResponseTypes.XML,ResponseTypes.JSON].indexOf(type) ? expr.evaluate(options) : expr.select(options)
        if(trace) (Array.isArray(result) ? result : result.nodes).forEach(e => XMapperService.handleTrace(trace,e))
        if((Array.isArray(result) && result.length == 0) || result == '')
            return null
        switch(type)
        {
            case ResponseTypes.NUMBER:
                if(typeof result === 'number') return result
                return parseFloat(result.toString())
            case ResponseTypes.BOOLEAN:
                return result.toString() === 'true'
            case ResponseTypes.JSON:
                var parsed = new DOMImplementation().createDocument()
                result.forEach(e => parsed.appendChild(e))
                return XMapperService.xmlToJson(parsed)
            case ResponseTypes.XML:
                var parsed = new DOMImplementation().createDocument()
                result.forEach(e => parsed.appendChild(e))
                return parsed
            default:
                return result.toString()
        }
    },
    queryEach:(dom,expr,type,variables,trace,multipart) => {
		if(!multipart && trace) XMapperService.traces = []
        var result = dom.reduce((res,curr) => {
            var processed = XMapperService.query(curr,expr,type,variables,trace,true)
            if(processed) {
                if(!res) res = [] 
                res.push(processed)
            }
            return res
        },null);
        return result
    },
    map:(mappings,initial,result,variables,trace,multipart) => {
		if(Array.isArray(initial)) return XMapperService.mapEach(mappings,initial,result,variables,trace)
		if(!multipart && trace) XMapperService.traces = []
        if(!result) result = {}
        mappings.forEach(mapping => {
            //if(!mapping.expression || !mapping.outputPath && mapping.outputPath !== "") throw "Mapping is invalid"
            var parsed = XMapperService.query(initial,mapping.expression,mapping.type || ResponseTypes.JSON,variables,trace ? (mapping.outputPath !== "" ? mapping.outputPath : "#root") : false,true)
            if(!parsed) return
            result = XMapperService.mapValueToResult(mapping.outputPath,parsed,result)
        })
        return result
    },
    mapEach:(mappings,initial,result,variables,trace) => {
		if(trace) XMapperService.traces = []
        var result = initial.reduce((res,curr) => {
            var processed = XMapperService.map(mappings,curr,result,variables,trace,true)
            if(processed) {
                if(!res) res = []
                res.push(processed)
            }
            return res
        },null) 
        return result
    },
    mapValueToResult: (path,value,output) => {
        if(!path || path == "") return value
        var result = Object.assign({},output)
        path.split('.').reduce((res,el,i,arr) => {
            var isLast = (i == arr.length-1)
            var isArray = isLast && el.endsWith('[]')
            if(isArray) el = el.substr(0,el.length - 2)
            if(!res[el]) {
                res[el] = isArray ? [] :{}
            } else if(isArray && !Array.isArray(res[el])) {
                res[el] = [res[el]]
            }
            
            if(isLast){
                if(isArray) return res[el].push(value)
                res[el] = value
            }
            return res[el]
        },result)
        return result
    }
}

export default XMapperService
const xpathFunctions = {
    min: (context,{nodes}) => Math.min( ...nodes.map(n => n.nodeValue) ),
    max: (context,{nodes}) => Math.max( ...nodes.map(n => n.nodeValue) ),
    avg: (context,{nodes}) =>  nodes.reduce((a,b) => a+parseFloat(b.nodeValue),0) / nodes.length,
}
const xmlToJson = (xml) => {
    var obj={}
    Object.keys(xml.attributes||{}).forEach(key => {
        var attr = xml.attributes[key]
        if(attr.constructor.name !== "Attr") return
        obj["@"+attr.nodeName] = attr.nodeValue
    })
    if (xml.constructor.name == "Text")
        return xml.nodeValue
    Object.keys(xml.childNodes||{}).forEach(key => {
        var item = xml.childNodes[key]
        var nodeName = item.nodeName
        if(!nodeName) return
        if (!obj[nodeName]) {
            obj[nodeName] = xmlToJson(item);
        } else {
            if (!Array.isArray(obj[nodeName])) {
                var old = obj[nodeName];
                obj[nodeName] = [];
                obj[nodeName].push(old);
            }
            obj[nodeName].push(xmlToJson(item));
        }
    })
    var keys = Object.keys(obj)||[]
    if(keys.length == 1 && keys[0] == "#text")
        return obj['#text']
    return obj
    
}
