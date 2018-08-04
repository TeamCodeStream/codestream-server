'use strict';

const PostUserTest = require('./post_user_test');
const RandomString = require('randomstring');

class UniqueUsernameTest extends PostUserTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserUsername = RandomString.generate(8); 
		this.existingUserOnTeam = true;
		this.teamCreatorUsername = this.existingUserUsername;
		this.existingUserIsRegistered = true;
	}

	get description () {
		return 'should return an error when inviting a user that is already on another team and they have a username conflict with a user on the current team';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000'
		};
	}
}

module.exports = UniqueUsernameTest;
