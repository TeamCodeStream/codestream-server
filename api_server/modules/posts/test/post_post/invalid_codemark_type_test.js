'use strict';

const CodemarkTest = require('./codemark_test');
const RandomString = require('randomstring');

class InvalidCodemarkTypeTest extends CodemarkTest {

	constructor (options) {
		super(options);
		this.codemarkType = RandomString.generate(10);
	}

	get description () {
		return 'should return an error when attempting to create a post with a codemark with an invalid type';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: { type: 'invalid codemark type' }
		};
	}
}

module.exports = InvalidCodemarkTypeTest;
