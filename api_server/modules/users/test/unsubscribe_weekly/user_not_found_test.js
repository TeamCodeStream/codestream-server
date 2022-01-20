'use strict';

const UnsubscribeTest = require('./unsubscribe_test');
const Assert = require('assert');
const ObjectId = require('mongodb').ObjectId;

class UserNotFoundTest extends UnsubscribeTest {

	constructor (options) {
		super(options);
		this.tokenUserId = ObjectId();
	}

	get description () {
		return 'should redirect to an error page when trying to unsubscribe from weekly emails by clicking an email link, providing a valid token that refers to an unknown user';
	}

	validateResponse (data) {
		Assert.strictEqual(data, '/web/unsubscribe-weekly-error?error=RAPI-1003', 'improper redirect');
	}
}

module.exports = UserNotFoundTest;
