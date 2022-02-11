'use strict';

const FetchUserTest = require('./fetch_user_test');
const ObjectId = require('mongodb').ObjectId;

class NotFoundByIdTest extends FetchUserTest {

	get description () {
		return 'when fetching a user across environments by ID, should return an error if the indicated user is not found';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	before (callback) {
		// we'll try to fetch a user with a random (non-existent) ID
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/xenv/fetch-user?id=' + ObjectId();
			callback();
		});
	}
}

module.exports = NotFoundByIdTest;
