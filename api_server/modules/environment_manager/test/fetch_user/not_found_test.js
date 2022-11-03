'use strict';

const FetchUserTest = require('./fetch_user_test');
const Assert = require('assert');
const ObjectId = require('mongodb').ObjectId;

class NotFoundTest extends FetchUserTest {

	get description () {
		return 'should return an empty result when trying to fetch a user that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	before (callback) {
		// we'll try to fetch a user with a random (non-existent) email
		super.before(error => {
			if (error) { return callback(error); }
			const randomEmail = this.userFactory.randomEmail();
			this.path = '/xenv/fetch-user?id=' + ObjectId();
			callback();
		});
	}
}

module.exports = NotFoundTest;
