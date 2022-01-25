'use strict';

const ConfirmUserTest = require('./confirm_user_test');
const Assert = require('assert');

class NotFoundTest extends ConfirmUserTest {

	get description () {
		return 'should return an empty result when trying to confirm a user that doesn\'t exist';
	}

	getExpectedFields () {
		return null;
	}

	// before the test runs...
	before (callback) {
		// we'll try to confirm a user with a random (non-existent) email
		super.before(error => {
			if (error) { return callback(error); }
			this.data.email = this.userFactory.randomEmail();
			callback();
		});
	}

	validateResponse (data) {
		Assert.deepStrictEqual(data, {}, 'returned data was not empty object');
	}
}

module.exports = NotFoundTest;
