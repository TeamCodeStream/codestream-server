'use strict';

const GetRepoTest = require('./get_repo_test');
const ObjectID = require('mongodb').ObjectID;

class NotFoundTest extends GetRepoTest {

	get description () {
		return 'should return an error when trying to fetch a repo that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	before (callback) {
		super.before (error => {
			// substitute a non-existent repo ID
			if (error) { return callback(error); }
			this.path = '/repos/' + ObjectID();
			callback();
		});
	}
}

module.exports = NotFoundTest;
