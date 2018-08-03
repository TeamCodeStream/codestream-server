'use strict';

const DeletePostTest = require('./delete_post_test');

class ACLTeamTest extends DeletePostTest {

	constructor (options) {
		super(options);
		this.withoutCurrentUserOnTeam = true;
		this.otherUserCreatesPost = true;
	}

	get description () {
		return 'should return an error when someone who is not on the team tries to delete a post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only the post author or a team admin can delete the post'
		};
	}
}

module.exports = ACLTeamTest;
