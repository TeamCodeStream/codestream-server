'use strict';

const UnfollowTest = require('./unfollow_test');
const ObjectID = require('mongodb').ObjectID;
const Assert = require('assert');

class CodemarkNotFoundTest extends UnfollowTest {

	get description () {
		return 'should redirect to an error page when trying to unfollow a non-existent codemark by clicking an email link';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// substitute an ID for a non-existent codemark
			this.path = `/no-auth/unfollow-link/${ObjectID()}?t=${this.token}`;
			callback();
		});
	}

	validateResponse (data) {
		Assert.equal(data, '/web/unfollow-error?error=RAPI-1003', 'improper redirect');
	}
}

module.exports = CodemarkNotFoundTest;
