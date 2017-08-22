import XMapperService from '../../src/XMapperService'
import chai from 'chai'
var {should,expect,equal,be,an} = chai;

describe('generateDom', function() {
  it('should build from xml',done => {
    var test = '<?xml version="1.0"?><foo><bar><id>1</id></bar><bar><id>2</id></bar></foo>'
    var res = XMapperService.generateDom(test)
    expect(res).to.be.an('object')
    done()
  })
  it('should build from html',done => {
    var test = '<html><header><title>This is title</title></header><body>Hello world</body></html>'
    var res = XMapperService.generateDom(test)
    expect(res).to.be.an('object')
    done()
  })
  it('should build from json',done => {
    var test = {foo:"bar"}
    var res = XMapperService.generateDom(test)
    expect(res).to.be.an('object')
    done()
  })

});

