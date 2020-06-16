'use strict';

const PutUserTest = require('./put_user_test');

class UsernameNotUniqueTest extends PutUserTest {

	get description () {
		return 'should return an error when user is trying to update their username and it is not unique for the team';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000'
		};
	}

	// form the data for the user update
	makeUserData (callback) {
		super.makeUserData(() => {
			// use the username for the "other user"
			this.data.username = this.users[1].user.username;
			callback();
		});
	}
}

module.exports = UsernameNotUniqueTest;
