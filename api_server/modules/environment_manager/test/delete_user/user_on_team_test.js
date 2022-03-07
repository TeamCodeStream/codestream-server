'use strict';

const DeleteUserTest = require('./delete_user_test');

class UserOnTeamTest extends DeleteUserTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.userOptions.numRegistered = 2;
	}

	get description () {
		return 'should return an error when deleting a user across environments that is on at least one team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			message: 'Not authorized to delete',
			reason: 'user is on at least one team'
		};
	}
}

module.exports = UserOnTeamTest;
