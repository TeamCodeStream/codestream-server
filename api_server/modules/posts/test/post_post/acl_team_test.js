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
	
	get description () {
		return 'should return an error when trying to create a post in a stream from a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}
}

module.exports = ACLTeamTest;
