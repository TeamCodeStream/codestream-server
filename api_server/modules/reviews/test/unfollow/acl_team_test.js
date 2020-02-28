'use strict';

const UnfollowTest = require('./unfollow_test');

class ACLTeamTest extends UnfollowTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 3;
		this.teamOptions.members = [2];
		this.skipFollow = true;
	}

	get description () {
		return 'should return an error when trying to unfollow a review on a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTeamTest;
