'use strict';

const DeletePostTest = require('./delete_post_test');

class ACLTeamTest extends DeletePostTest {

	get description () {
		return 'should return an error when someone who is not on the team tries to delete a post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'the user does not have access to this post'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}
}

module.exports = ACLTeamTest;
