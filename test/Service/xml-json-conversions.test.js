import XMapperService from '../../src/XMapperService'
import chai from 'chai'
var {should,expect,equal} = chai;

describe('jsonToXML', function() {
  it('should handle empty element',done => {
    var test = {root:{}}
    var res = XMapperService.jsonToXML(test)
    expect(res).to.equal('<?xml version="1.0"?><root/>')
    done()
  })

  it('should read string as text',done => {
    var test = {foo:"bar"}
    var res = XMapperService.jsonToXML(test)
    expect(res).to.equal('<?xml version="1.0"?><foo>bar</foo>')
    done()
  })
  it('should handle single string result',done => {
    var test = "bar"
    var res = XMapperService.jsonToXML(test)
    expect(res).to.equal('bar')
    done()
  })
  it('should read @ element as attribute',done => {
    var test = {foo:{"@baz":"bar"}}
    var res = XMapperService.jsonToXML(test)
    expect(res).to.equal('<?xml version="1.0"?><foo baz="bar"/>')
    done()
  })
  
  it('should read #text element as text',done => {
    var test = {foo:{"#text":"bar"}}
    var res = XMapperService.jsonToXML(test)
    expect(res).to.equal('<?xml version="1.0"?><foo>bar</foo>')
    done()
  })
  it('should handle text arrays',done => {
    var test = {root:{foo:["bar","baz"]}}
    var res = XMapperService.jsonToXML(test)
    expect(res).to.equal('<?xml version="1.0"?><root><foo>bar</foo><foo>baz</foo></root>')
    done()
  })
  it('should handle arrays',done => {
    var test = {foo:{bar:[{id:"1"},{id:"2"}]}}
    var res = XMapperService.jsonToXML(test)
    expect(res).to.equal('<?xml version="1.0"?><foo><bar><id>1</id></bar><bar><id>2</id></bar></foo>')
    done()
  })

});

describe('xmlToJson', function() {
  it('should handle empty element',done => {
    var test = '<root/>'
    var res = XMapperService.xmlToJson(test)
    expect(res).to.deep.equal({root:{}})
    done()
  })
  it('should read string as text',done => {
    var test = '<?xml version="1.0"?><foo>bar</foo>'
    var res = XMapperService.xmlToJson(test)
    expect(res).to.deep.equal({foo:"bar"})
    done()
  })
  it('should handle single string result',done => {
    var test = '<?xml version="1.0"?>bar'
    var res = XMapperService.xmlToJson(test)
    expect(res).to.deep.equal("bar")
    done()
  })
  it('should read attributes as @ elements',done => {
    var test = '<?xml version="1.0"?><foo baz="bar"/>'
    var res = XMapperService.xmlToJson(test)
    expect(res).to.deep.equal({foo:{"@baz":"bar"}})
    done()
  })
  it('should set text as #text if @attr',done => {
    var test = '<?xml version="1.0"?><foo id="1">bar</foo>'
    var res = XMapperService.xmlToJson(test)
    expect(res).to.deep.equal({foo:{"@id":"1","#text":"bar"}})
    done()
  })

  it('should handle text arrays',done => {
    var test = '<root><foo>bar</foo><foo>baz</foo></root>'
    var res = XMapperService.xmlToJson(test)
    expect(res).to.deep.equal({root:{foo:["bar","baz"]}})
    done()
  })
  it('should handle arrays',done => {
    var test = '<?xml version="1.0"?><foo><bar><id>1</id></bar><bar><id>2</id></bar></foo>'
    var res = XMapperService.xmlToJson(test)
    expect(res).to.deep.equal({foo:{bar:[{id:"1"},{id:"2"}]}})
    done()
  })
});