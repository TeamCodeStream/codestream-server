'use strict';

const PostPostTest = require('./post_post_test');

class ACLTeamTest extends PostPostTest {

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			this.streamOptions.members = [];
			callback();
		});
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'not authorized for stream'
		};
	}

	get description () {
		return 'should return an error when trying to create a post in a stream for a team that i\'m not a member of';
	}
}

module.exports = ACLTeamTest;
