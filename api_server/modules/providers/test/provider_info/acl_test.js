'use strict';

const ProviderInfoTest = require('./provider_info_test');

class ACLTest extends ProviderInfoTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return an error when trying to set provider info for a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTest;
