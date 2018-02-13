'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var ConfirmationTest = require('./confirmation_test');
var ConfirmCode = require('../../confirm_code');

class MaxAttemptsTest extends ConfirmationTest {

	get description () {
		return 'should return an error when an incorrect confirmation code is used during confirmation and the maximum number of attempts has been reached';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'USRC-1004'
		};
	}

	// make a confirmation code that doesn't match the expected confirmation code
	makeBadConfirmCode () {
		let newConfirmCode;
		do {
			newConfirmCode = ConfirmCode();
		} while (newConfirmCode === this.data.confirmationCode);
		this.data.confirmationCode = newConfirmCode;
	}

	// attempt to confirm the indicated number of times with a bad confirmation code
	attemptConfirm (n, callback) {
		this.makeBadConfirmCode();
		this.doApiRequest({
			method: this.method,
			path: this.path,
			data: this.data
		}, () => {
			callback();
		});
	}

	// before the test runs...
	before (callback) {
		// attempt to confirm with an incorrect confirmation code three times ... on the fourth attempt,
		// we should get a different error indicating we've reached the maximum number of attempts
		super.before(() => {
			BoundAsync.timesSeries(
				this,
				3,
				this.attemptConfirm,
				callback
			);
		});
	}
}

module.exports = MaxAttemptsTest;
