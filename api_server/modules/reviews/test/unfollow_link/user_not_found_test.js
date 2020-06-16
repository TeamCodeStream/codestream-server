'use strict';

const UnfollowTest = require('./unfollow_test');
const Assert = require('assert');
const ObjectID = require('mongodb').ObjectID;

class UserNotFoundTest extends UnfollowTest {

	constructor (options) {
		super(options);
		this.tokenUserId = ObjectID();
	}

	get description () {
		return 'should redirect to an error page when trying to unfollow a review by clicking an email link, providing a valid token that refers to an unknown user';
	}

	validateResponse (data) {
		Assert.equal(data, '/web/unfollow-review-error?error=RAPI-1003', 'improper redirect');
	}
}

module.exports = UserNotFoundTest;
