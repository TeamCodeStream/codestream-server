'use strict';

const DeleteClaimedTest = require('./delete_claimed_test');

class NoDeleteClaimedByOtherTeamTest extends DeleteClaimedTest {

	get description () {
		return 'should return an error when trying to delete a code error that has been claimed by another team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only the creator or a team admin can delete a code error'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.creatorIndex = 1;
			this.teamOptions.members = [];
			callback();
		});
	}
}

module.exports = NoDeleteClaimedByOtherTeamTest;
