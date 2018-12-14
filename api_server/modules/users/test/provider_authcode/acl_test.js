'use strict';

const ProviderAuthCodeTest = require('./provider_authcode_test');

class ACLTest extends ProviderAuthCodeTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			members: []
		});
	}

	get description () {
		return 'should return an error when requesting a provider auth code but the user is not on the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}
}

module.exports = ACLTest;
