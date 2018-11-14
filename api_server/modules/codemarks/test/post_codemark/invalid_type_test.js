'use strict';

const PostCodemarkTest = require('./post_codemark_test');
const RandomString = require('randomstring');

class InvalidTypeTest extends PostCodemarkTest {

	constructor (options) {
		super(options);
		this.codemarkType = RandomString.generate(10);
	}

	get description () {
		return 'should return an error when attempting to create a codemark with an invalid type';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: { type: 'invalid codemark type' }
		};
	}
}

module.exports = InvalidTypeTest;
