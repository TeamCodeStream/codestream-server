'use strict';

var ConfirmationTest = require('./confirmation_test');
var ObjectId = require('mongodb').ObjectId;

class InvalidUserIdTest extends ConfirmationTest {

	get description () {
		return 'should return an error when confirming a registration with an invalid user ID';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	before (callback) {
		// run the standard setup for a confirmation test, but change the user ID
		super.before(() => {
			this.data.userId = ObjectId();
			callback();
		});
	}
}

module.exports = InvalidUserIdTest;
