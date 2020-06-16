'use strict';

const UnfollowTest = require('./unfollow_test');
const Assert = require('assert');

class TokenExpiredTest extends UnfollowTest {

	constructor (options) {
		super(options);
		this.expiresIn = 100;
	}

	get description () {
		return 'should redirect to an error page when trying to unfollow a review by clicking an email link, but with an expired token';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			setTimeout(callback, 101);
		});
	}

	validateResponse (data) {
		Assert.equal(data, '/web/unfollow-review-error?error=AUTH-1005', 'improper redirect');
	}
}

module.exports = TokenExpiredTest;
