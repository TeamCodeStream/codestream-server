'use strict';

const UnsubscribeTest = require('./unsubscribe_test');
const Assert = require('assert');

class NotUnfollowTokenTest extends UnsubscribeTest {

	constructor (options) {
		super(options);
		this.tokenType = 'xxx';
	}

	get description () {
		return 'should redirect to an error page when trying to unsubscribe from weekly emails by clicking an email link, providing a valid token that is not an unsubscribe token';
	}

	validateResponse (data) {
		Assert.strictEqual(data, '/web/unsubscribe-weekly-error?error=AUTH-1002', 'improper redirect');
	}
}

module.exports = NotUnfollowTokenTest;
