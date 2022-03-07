'use strict';

const FetchUserTest = require('./fetch_user_test');
const Assert = require('assert');

class NotFoundTest extends FetchUserTest {

	get description () {
		return 'should return an empty result when trying to fetch a user that doesn\'t exist';
	}

	getExpectedFields () {
		return null;
	}

	// before the test runs...
	before (callback) {
		// we'll try to fetch a user with a random (non-existent) email
		super.before(error => {
			if (error) { return callback(error); }
			const randomEmail = this.userFactory.randomEmail();
			this.path = '/xenv/fetch-user?email=' + encodeURIComponent(randomEmail);
			callback();
		});
	}

	validateResponse (data) {
		Assert.deepStrictEqual(data, {}, 'returned data was not empty object');
	}
}

module.exports = NotFoundTest;
