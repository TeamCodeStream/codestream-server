'use strict';

const RemoveUserTest = require('./remove_user_test');

class NoRemoveSelfTest extends RemoveUserTest {

	get description () {
		return 'should return an error if a user tries to remove themselves from a team';
	}
   
	getExpectedError () {
		return {
			code: 'RAPI-1005'
		};
	}

	// get the users we want to remove from the team
	getRemovedUsers () {
		return [this.currentUser, ...this.otherUserData.slice(1).map(data => data.user)];
	}
}

module.exports = NoRemoveSelfTest;
