'use strict';

var RegistrationTest = require('./registration_test');

class NoBetaCodeTest extends RegistrationTest {

	get description () {
		return 'should return an error when no beta code is provided';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'betaCode'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the beta code
		super.before(() => {
			delete this.data.betaCode;
			callback();
		});
	}
}

module.exports = NoBetaCodeTest;
