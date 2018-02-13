'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var ConfirmationTest = require('./confirmation_test');

class AlreadyRegisteredTest extends ConfirmationTest {

	get description () {
		return 'should return an error when confirming a registration with an email that has already been confirmed';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'USRC-1006'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// run the standard setup, this will actually create a user who has already been confirmed
			this.confirm 	// now try to confirm again...
		], callback);
	}

	// try to confirm the user we just confirmed ... again!
	confirm (callback) {
		this.doApiRequest({
			method: this.method,
			path: this.path,
			data: this.data
		}, callback);
	}
}

module.exports = AlreadyRegisteredTest;
