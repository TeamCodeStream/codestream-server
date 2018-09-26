'use strict';

const PostUserTest = require('./post_user_test');

class ACLTest extends PostUserTest {

	get description () {
		return 'should return an error when trying to create a user on a team i\'m not a member of';
	}

	setOptions () {
		super.setOptions();
		const index = this.teamOptions.members.indexOf(0);
		this.teamOptions.members.splice(index, 1);
		this.teamOptions.creatorIndex = this.teamOptions.inviterIndex = 1;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}
}

module.exports = ACLTest;
