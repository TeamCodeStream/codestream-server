'use strict';

const UnpinPostTest = require('./unpin_post_test');

class ACLTeamTest extends UnpinPostTest {

	get description () {
		return 'should return an error when trying to unpin a post from a codemark created in a team the user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'must be a member of the team'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			callback();
		});
	}
}

module.exports = ACLTeamTest;
