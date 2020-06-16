'use strict';

const UnfollowTest = require('./unfollow_test');
const ObjectID = require('mongodb').ObjectID;

class CodemarkNotFoundTest extends UnfollowTest {

	get description () {
		return 'should return an error when trying to unfollow a non-existent codemark';
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
			this.path = `/codemarks/unfollow/${ObjectID()}`;
			callback();
		});
	}
}

module.exports = CodemarkNotFoundTest;
