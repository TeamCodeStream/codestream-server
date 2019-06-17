'use strict';

const DeleteProviderHostTest = require('./delete_provider_host_test');

class ACLTest extends DeleteProviderHostTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
		this.teamOptions.creatorIndex = 1;
		this.userToAddHostIndex = 1;
	}

	get description () {
		return 'should return an error when trying to delete a provider host for a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013'
		};
	}
}

module.exports = ACLTest;
