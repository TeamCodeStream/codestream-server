'use strict';

const UnpinTest = require('./unpin_test');
const ObjectId = require('mongodb').ObjectId;

class CodemarkNotFoundTest extends UnpinTest {

	get description () {
		return 'should return an error when trying to unpin a codemark that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'codemark'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/unpin/' + ObjectId(); // substitute an ID for a non-existent codemark
			callback();
		});
	}
}

module.exports = CodemarkNotFoundTest;
