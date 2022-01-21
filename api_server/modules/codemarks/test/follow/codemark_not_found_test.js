'use strict';

const FollowTest = require('./follow_test');
const ObjectId = require('mongodb').ObjectId;

class CodemarkNotFoundTest extends FollowTest {

	get description () {
		return 'should return an error when trying to follow a non-existent codemark';
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
			// substitute an ID for a non-existent codemark
			this.path = `/codemarks/follow/${ObjectId()}`;
			callback();
		});
	}
}

module.exports = CodemarkNotFoundTest;
