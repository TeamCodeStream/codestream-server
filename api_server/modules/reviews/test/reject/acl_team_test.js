'use strict';

const RejectTest = require('./reject_test');

class ACLTeamTest extends RejectTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 3;
		this.teamOptions.members = [2];
	}

	get description () {
		return 'should return an error when trying to reject a review on a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTeamTest;
