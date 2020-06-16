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

	// before the test runs...
	before (callback) {
		// run the standard setup for a confirmation, but use a timeout which times out the 
		// confirmation code VERY quickly
		this.userOptions.timeout = 100;
		super.before(error => {
			if (error) { return callback(error); }
			setTimeout(callback, 100);
		});
	}
}

module.exports = ExpirationTest;
