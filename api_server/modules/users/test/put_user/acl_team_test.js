'use strict';

const ACLTest = require('./acl_test');

class ACLTeamTest extends ACLTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when someone who is not on the team tries to update a different user';
	}
}

module.exports = ACLTeamTest;
