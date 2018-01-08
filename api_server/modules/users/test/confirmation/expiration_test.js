'use strict';

var ConfirmationTest = require('./confirmation_test');

class ExpirationTest extends ConfirmationTest {

	get description () {
		return 'should return an error when a confirmation code is expired';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'USRC-1003'
		};
	}

	before (callback) {
		this.userOptions = {
			timeout: 100
		};
		super.before(() => {
			setTimeout(callback, 100);
		});
	}
}

module.exports = ExpirationTest;
