'use strict';

const PutCodemarkTest = require('./put_codemark_test');

class RequiredForTypeTest extends PutCodemarkTest {

	constructor (options) {
		super(options);
		this.goPostless = true;
	}
	
	get description () {
		return `should return an error if trying to update a ${this.codemarkType} codemark with blank ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: `${this.codemarkType} codemarks require ${this.attribute}`
		};
	}

	makeCodemarkUpdateData (callback) {
		super.makeCodemarkUpdateData(() => {
			this.data[this.attribute] = '';
			callback();
		});
	}
}

module.exports = RequiredForTypeTest;
