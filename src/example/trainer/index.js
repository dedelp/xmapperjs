import React, { Component } from 'react';
import Menu from '../components/menu'
import JSONTree from 'react-json-tree'
import XMapperService from '../../XMapperService'
import styles from './trainer.scss'



export default class App extends Component {
	constructor(props) {
		super(props)
		this.state = {
			object: DEFAULT_OBJECT,
			traces: [],
			result: {}
		}
		this.search=this.search.bind(this)
		this.valueRenderer = this.valueRenderer.bind(this)
	}
	search(xpath) {
		const {object} = this.state
		var result = XMapperService.query(object,xpath,XMapperService.ResponseTypes.JSON,{},true)
		var traces = (XMapperService.traces||[]).map(t => ({
			trace:t.trace,
			path:t.path.join('/').replace(/^#text\//,'')
		}))
		this.setState(state => {
			state.traces = traces
			state.result = result
		})
	}
	valueRenderer([...params]) {
		console.log('valueRenderer',arguments)
	}
	render() {
		const {object,result,traces} = this.state
		return (
			<div className={styles.container}>
				<Menu />
				<input type="text" className={styles.textBox} onChange={(e) => this.search(e.target.value)} />
				<div className={styles.flex}>
					<div className={styles.card}>
						<JSONTree theme="google" data={object} hideRoot={true} shouldExpandNode={() => true} labelRenderer={(keypath) => {
							var traced = hasParentTrace(traces,keypath) 
							return <span style={traced ? {background:'#ff0'} : {}}>{keypath[0]}</span>}} 
							valueRenderer={this.valueRenderer} 
						/>
					</div>
					<div className={styles.card}>
						<JSONTree theme="google" data={result || {}} hideRoot={true} shouldExpandNode={() => true}/>
					</div>
				</div>
			</div>
		);
	}
}
const hasParentTrace = (traces,path) => {
	var trace = false
	var path = path.join('/')
	traces.forEach(t => {
		if(~path.indexOf(t.path))
		{
			trace = true
			return false //break
		}
	})
	return trace
}
const DEFAULT_OBJECT = {
	"store": {
	   "book": [
		  {
			 "title": "Sword of Honour",
			 "category": "fiction",
			 "author": "Evelyn Waugh",
			 "@price": 12.99
		  },
		  {
			 "title": "Moby Dick",
			 "category": "fiction",
			 "author": "Herman Melville",
			 "isbn": "0-553-21311-3",
			 "@price": 8.99
		  },
		  {
			 "title": "Sayings of the Century",
			 "category": "reference",
			 "author": "Nigel Rees",
			 "@price": 8.95
		  },
		  {
			 "title": "The Lord of the Rings",
			 "category": "fiction",
			 "author": "J. R. R. Tolkien",
			 "isbn": "0-395-19395-8",
			 "@price": 22.99
		  }
	   ],
	   "bicycle": {
		  "brand": "Cannondale",
		  "color": "red",
		  "@price": 19.95
	   }
	}
 }