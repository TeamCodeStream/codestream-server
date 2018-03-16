'use strict';

var ACLTest = require('./acl_test');

class ACLTeamTest extends ACLTest {

	constructor (options) {
		super(options);
		this.withoutOtherUserOnTeam = true;
	}

	get description () {
		return 'should return an error when someone who is not on the team tries to delete a post';
	}
}

module.exports = ACLTeamTest;
