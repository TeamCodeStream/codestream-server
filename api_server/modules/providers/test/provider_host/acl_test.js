'use strict';

const ProviderHostTest = require('./provider_host_test');

class ACLTest extends ProviderHostTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return an error when trying to add a provider host for a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTest;
