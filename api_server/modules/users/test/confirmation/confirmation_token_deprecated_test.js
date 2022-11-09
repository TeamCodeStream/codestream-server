'use strict';

const ConfirmationTest = require('./confirmation_test');
const UUID = require('uuid').v4;

class ConfirmationTokenDeprecatedTest extends ConfirmationTest {

	get description () {
		return 'should return an error indicating functionality is deprecated confirming a registration using a token issued in a confirmation link';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016',
			reason: 'confirmation tokens are deprecated'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.token = UUID();
			callback();
		});
	}
}

module.exports = ConfirmationTokenDeprecatedTest;
