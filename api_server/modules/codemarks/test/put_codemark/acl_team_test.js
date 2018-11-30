'use strict';

const PutCodemarkTest = require('./put_codemark_test');

class ACLTeamTest extends PutCodemarkTest {

	get description () {
		return 'should return an error when trying to update a codemark in a team the user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only the author.* can update a codemark'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			this.teamOptions.members = [];
			callback();
		});
	}
}

module.exports = ACLTeamTest;
