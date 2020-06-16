'use strict';

const ProviderSetTokenTest = require('./provider_set_token_test');

class ACLTest extends ProviderSetTokenTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return an error when trying to add a provider token for a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTest;
