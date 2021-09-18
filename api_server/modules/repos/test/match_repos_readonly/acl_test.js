'use strict';

const MatchRepoTest = require('./match_repo_test');

class ACLTest extends MatchRepoTest {

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			callback();
		});
	}
	
	get description () {
		return 'should return an error when trying to match repos in a team the user is not a member of (in read-only mode)';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTest;
