'use strict';

const ProviderAuthCodeTest = require('./provider_authcode_test');

class NoTeamIdTest extends ProviderAuthCodeTest {

	get description () {
		return 'should return error when requesting a provider auth code with no teamId';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'teamId'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the attribute in question
		super.before(() => {
			this.path = '/provider-auth-code';
			callback();
		});
	}
}

module.exports = NoTeamIdTest;
