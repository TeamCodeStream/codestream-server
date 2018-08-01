'use strict';

const AddAdminsTest = require('./add_admins_test');

class UsersNotOnTeamTest extends AddAdminsTest {

	constructor (options) {
		super(options);
		this.dontAddOtherUsers = true;
	}

	get description () {
		return 'should return an error when trying to add admins when one or more of the users aren\'t on the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = UsersNotOnTeamTest;
