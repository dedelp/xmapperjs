import XMapperService from '../../src/XMapperService'
import chai from 'chai'
var { should, expect, equal, be, an, throws } = chai;
var { ResponseTypes } = XMapperService
describe('mapValueToResult', function () {
	it('should map literal', done => {
		var result = {}
		var value = 3
		var path = "test"
		var res = XMapperService.mapValueToResult(path, value, result)
		expect(res).to.deep.equal({ test: 3 })
		done()
	})
	it('should map object', done => {
		var result = {}
		var value = { foo: "bar" }
		var path = "test"
		var res = XMapperService.mapValueToResult(path, value, result)
		expect(res).to.deep.equal({ test: { foo: "bar" } })
		done()
	})
	it('should map to root if no path', done => {
		var result = {}
		var value = { foo: "bar" }
		var path = ""
		var res = XMapperService.mapValueToResult(path, value, result)
		expect(res).to.deep.equal({ foo: "bar" })
		done()
	})
	it('should overwrite value if already exists', done => {
		var result = { test: { foo: "bar" } }
		var value = { foo: "baz" }
		var path = "test"
		var res = XMapperService.mapValueToResult(path, value, result)
		expect(res).to.deep.equal({ test: { foo: "baz" } })
		done()
	})
	it('should create array when path ends with []', done => {
		var result = {}
		var value = { foo: "bar" }
		var path = "test[]"
		var res = XMapperService.mapValueToResult(path, value, result)
		expect(res).to.deep.equal({ test: [{ foo: "bar" }] })
		done()
	})
	it('should push value to array when path ends with []', done => {
		var result = { test: [{ a: "b" }] }
		var value = { foo: "bar" }
		var path = "test[]"
		var res = XMapperService.mapValueToResult(path, value, result)
		expect(res).to.deep.equal({ test: [{ a: "b" }, { foo: "bar" }] })
		done()
	})
	it('should wrap current value in array and push value to array when path ends with []', done => {
		var result = { test: { a: "b" } }
		var value = { foo: "bar" }
		var path = "test[]"
		var res = XMapperService.mapValueToResult(path, value, result)
		expect(res).to.deep.equal({ test: [{ a: "b" }, { foo: "bar" }] })
		done()
	})

})
describe('map the things', function () {
	it('should map basic values', done => {
		var initial = { players: [{ points: 10 }, { points: 20 }, { points: 15 }] }
		var mappings = [
			{
				expression: "count(/players)",
				type: ResponseTypes.NUMBER,
				outputPath: "totalPlayers"
			},
			{
				expression: "avg(/players/points/text())",
				type: ResponseTypes.NUMBER,
				outputPath: "averagePoints"
			}
		]
		var res = XMapperService.map(mappings, initial, {})
		expect(res).to.deep.equal({ totalPlayers: 3, averagePoints: 15 })
		done()
	})
	it('should map xml for future use', done => {
		var initial = { players: [{ points: 10 }, { points: 20 }, { points: 15 }] }
		var mapping1 = [
			{
				expression: "/players[points > 10]",
				type: ResponseTypes.XML,
				outputPath: "players"
			}
		]
		var res1 = XMapperService.map(mapping1, initial, {})
		expect(res1.players.toString()).to.equal("<players><points>20</points></players><players><points>15</points></players>")
		var mapping2 = [
			{
				expression: "sum(/players/points/text())",
				type: ResponseTypes.NUMBER,
				outputPath: "totalPoints"
			}
		]
		var res2 = XMapperService.map(mapping2, res1.players, {})
		expect(res2).to.deep.equal({ totalPoints: 35 })
		done()
	})

	it('should return array of mapped elements when passed array', done => {
		var initial = [{ team: { id: 1, players: [{ points: 10 }, { points: 20 }, { points: 15 }] } }, { team: { id: 2, players: [{ points: 18 }, { points: 17 }, { points: 6 }] } }]
		var mappings = [
			{
				expression: "sum(/team/players/points)",
				type: ResponseTypes.NUMBER,
				outputPath: "team.totalPoints"
			}
		]
		var res1 = XMapperService.map(mappings, initial, {})
		expect(res1).to.deep.equal([{ team: { totalPoints: 45 } }, { team: { totalPoints: 41 } }])
		done()
	}),
		it('should copy entire element to root if no outputPath', done => {
			var initial = [{ team: { id: 1, players: [{ points: 10 }, { points: 20 }, { points: 15 }] } }, { team: { id: 2, players: [{ points: 18 }, { points: 17 }, { points: 6 }] } }]
			var mappings = [
				{
					expression: "/team",
					type: ResponseTypes.JSON,
					outputPath: ""
				},
				{
					expression: "sum(/team/players/points)",
					type: ResponseTypes.NUMBER,
					outputPath: "team.totalPoints"
				}
			]
			var res1 = XMapperService.map(mappings, initial, {})
			expect(res1).to.deep.equal([{ team: { id: "1", players: [{ points: "10" }, { points: "20" }, { points: "15" }], totalPoints: 45 } }, { team: { id: "2", players: [{ points: "18" }, { points: "17" }, { points: "6" }], totalPoints: 41 } }])
			done()
		}),
		it('should append if output path array already exists', done => {
			var initial = { team: { id: 1, players: [{ points: 10 }, { points: 20 }, { points: 15 }] } }
			var mappings = [
				{
					expression: "/team/players/points[1]",
					type: ResponseTypes.NUMBER,
					outputPath: "points[]"
				}
			]
			var res1 = XMapperService.map(mappings, initial, { points: [2] })
			expect(res1).to.deep.equal({ points: [2, 10] })
			done()
		})
	/*
	it('should trace basic mappings',done => {
	  var initial = XMapperService.generateDom({team:{id:1}})
	  var mappings = [
		  {
			  expression:"/team/id",
			  type:ResponseTypes.JSON,
			  outputPath:"team.id"
		  }
	  ]
	  var res1 = XMapperService.map(mappings,initial,{},{},true)
	  expect(XMapperService.xmlToJson(initial)).to.deep.equal({team:{id:{__trace:"team.id","#text":"1"}}}) 
	  done()
	})
	it('should trace text elements',done => {
	  var initial = XMapperService.generateDom({team:{id:1,players:[{points:10},{points:20},{points:15}]}})
	  var mappings = [
		   {
			 expression:"/team/players/points/text()",
			 type:ResponseTypes.JSON,
			 outputPath:"team.points"
		  }
	  ]
	  var res1 = XMapperService.map(mappings,initial,{},{},true)
	  expect(XMapperService.xmlToJson(initial)).to.deep.equal({team:{id:"1",players:[{points:{__trace:"team.points","#text":"10"}},{points:{__trace:"team.points","#text":"20"}},{points:{__trace:"team.points","#text":"15"}}]}}) 
	  done()
	})
    
	it('should trace all mappings',done => {
	  var initial = XMapperService.generateDom({team:{id:1,players:[{points:10},{points:20},{points:15}]}})
	  var mappings = [
		{
		  expression:"/team/id",
		  type:ResponseTypes.NUMBER,
		  outputPath:"team.id"
		},
		{
		  expression:"/team/players/points/text()",
		  type:ResponseTypes.JSON,
		  outputPath:"team.points"
		}  
	  ]
	  var res1 = XMapperService.map(mappings,initial,{},{},true)
	  expect(XMapperService.xmlToJson(initial)).to.deep.equal({team:{id:{__trace:"team.id","#text":"1"},players:[{points:{__trace:"team.points","#text":"10"}},{points:{__trace:"team.points","#text":"20"}},{points:{__trace:"team.points","#text":"15"}}]}}) 
	  done()
	})*/
})