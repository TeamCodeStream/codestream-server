'use strict';

const FollowTest = require('./follow_test');
const ObjectId = require('mongodb').ObjectId;

class CodeErrorNotFoundTest extends FollowTest {

	get description () {
		return 'should return an error when trying to follow a non-existent code error';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'code error'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// substitute an ID for a non-existent code error
			this.path = `/code-errors/follow/${ObjectId()}`;
			callback();
		});
	}
}

module.exports = CodeErrorNotFoundTest;
