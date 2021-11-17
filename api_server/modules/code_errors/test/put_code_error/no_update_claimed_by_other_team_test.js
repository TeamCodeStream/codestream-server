'use strict';

const UpdateClaimedTest = require('./update_claimed_test');

class NoUpdateClaimedByOtherTeamTest extends UpdateClaimedTest {

	get description () {
		return 'should return an error when trying to update a code error that has been claimed by another team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'user is not on the team that owns this code error'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			callback();
		});
	}
}

module.exports = NoUpdateClaimedByOtherTeamTest;
