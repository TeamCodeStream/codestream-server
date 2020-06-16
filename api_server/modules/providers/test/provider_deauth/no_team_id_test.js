'use strict';

const ProviderDeauthTest = require('./provider_deauth_test');

class NoTeamIdTest extends ProviderDeauthTest {

	get description () {
		return 'should return error attempting to clear third-party provider credentials without providing a team ID';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'teamId'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(() => {
			delete this.data.teamId;
			callback();
		});
	}
}

module.exports = NoTeamIdTest;
