'use strict';

const UnfollowTest = require('./unfollow_test');
const Assert = require('assert');

class NotUnfollowTokenTest extends UnfollowTest {

	constructor (options) {
		super(options);
		this.tokenType = 'xxx';
	}

	get description () {
		return 'should redirect to an error page when trying to unfollow a review by clicking an email link, providing a valid token that is not an unfollow token';
	}

	validateResponse (data) {
		Assert.equal(data, '/web/unfollow-error?error=AUTH-1002', 'improper redirect');
	}
}

module.exports = NotUnfollowTokenTest;
