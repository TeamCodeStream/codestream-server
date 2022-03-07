'use strict';

const ConfirmUserTest = require('./confirm_user_test');
const Assert = require('assert');

class AlreadyRegisteredTest extends ConfirmUserTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		this.userOptions.numUnregistered = 0;
	}

	get description () {
		return 'should return an empty result when trying to confirm a user that has already been confirmed';
	}

	getExpectedFields () {
		return null;
	}

	validateResponse (data) {
		Assert.deepStrictEqual(data, {}, 'returned data was not empty object');
	}
}

module.exports = AlreadyRegisteredTest;
