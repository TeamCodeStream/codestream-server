// provide a factory for creating random code errors, for testing purposes

'use strict';

const RandomString = require('randomstring');

class RandomCodeErrorFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	randomAccountId () {
		return Math.floor(Math.random() * 1000000);
	}

	randomObjectId () {
		return RandomString.generate(40);
	}

	// get some random codemark data
	getRandomCodeErrorData (options = {}) {
		const data = {
			accountId: this.randomAccountId(),
			objectId: this.randomObjectId(),
			objectType: 'errorGroup',
			stackTraces: [this.getRandomStackTraceInfo(options)],
			providerUrl: 'https://one.newrelic.com',
			title: RandomString.generate(100),
			text: RandomString.generate(1000)
		};
		return data;
	}

	// get a "random" stack trace
	getRandomStackTraceInfo (/*options = {}*/) {
		const stackInfo = {
			text: `Error: ${RandomString.generate(32)}\n`,
			traceId: RandomString.generate(20),
			lines: []
		};
		for (let i = 0; i < 10; i++) {
			const className = RandomString.generate(10);
			const method = RandomString.generate(10);
			const fileName = '_'.repeat(8).split('').map(_ => RandomString.generate(8)).join('/') + '.js';
			const line = Math.floor(Math.random() * 500);
			const char = Math.floor(Math.random() * 100);
			stackInfo.lines.push({
				fileRelativePath: fileName,
				fileFullPath: `\\${fileName}`,
				method: `${className}.${method}`,
				line,
				column: char
			});
			stackInfo.text += `at ${className}.${method} (${fileName}:${line}:${char})\n`;
		}
		return stackInfo;
	}
}

module.exports = RandomCodeErrorFactory;
