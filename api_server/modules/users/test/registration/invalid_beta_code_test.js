'use strict';

var RegistrationTest = require('./registration_test');

class InvalidBetaCodeTest extends RegistrationTest {

	get description () {
		return 'should return an error when an invalid beta code is provided';
	}

	getExpectedError () {
		return {
			code: 'USRC-1009'
		};
	}

	before (callback) {
		super.before(() => {
			this.data.betaCode = 'XXXXXX';
			callback();
		});
	}
}

module.exports = InvalidBetaCodeTest;
