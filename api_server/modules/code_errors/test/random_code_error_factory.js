// provide a factory for creating random code errors, for testing purposes

'use strict';

const RandomString = require('randomstring');

class RandomCodeErrorFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// get some random codemark data
	getRandomCodeErrorData (options = {}) {
		const data = {
			status: 'open',
			stackTraces: [this.getRandomStackTrace(options)],
			url: 'https://one.newrelic.com'
		};
		if (options.wantMarkers) {
			data.markers = this.markerFactory.createRandomMarkers(options.wantMarkers, options);
		}
		return data;
	}

	// get a "random" stack trace
	getRandomStackTrace (/*options = {}*/) {
		const msg = `Error: ${RandomString.generate(32)}\n`;
		const trace = [];
		for (let i = 0; i < 10; i++) {
			const className = RandomString.generate(10);
			const method = RandomString.generate(10);
			const fileName = '_'.repeat(8).split('').map(_ => RandomString.generate(8)).join('/');
			const line = Math.floor(Math.random() * 500);
			const char = Math.floor(Math.random() * 100);
			trace.push(`at ${className}.${method} (${fileName}.js:${line}:${char})\n`);
		}
		return msg + trace.join('\n');
	}
}

module.exports = RandomCodeErrorFactory;
