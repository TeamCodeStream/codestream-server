'use strict';

var ConfirmationTest = require('./confirmation_test');
var ObjectID = require('mongodb').ObjectID;

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

	before (callback) {
		super.before(() => {
			this.data.userId = ObjectID();
			callback();
		});
	}
}

module.exports = InvalidUserIdTest;
