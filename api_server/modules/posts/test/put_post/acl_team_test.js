'use strict';

const ACLTest = require('./acl_test');

class ACLTeamTest extends ACLTest {

	get description () {
		return 'should return an error when someone who is not on the team tries to update a post';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.creatorIndex = 1;
			this.teamOptions.members = [];
			callback();
		});
	}
}

module.exports = ACLTeamTest;
