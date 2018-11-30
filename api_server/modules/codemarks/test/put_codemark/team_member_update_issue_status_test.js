'use strict';

const PutCodemarkTest = require('./put_codemark_test');
const RandomString = require('randomstring');

class TeamMemberUpdateIssueStatusTest extends PutCodemarkTest {

	get description () {
		return 'a team member should be able to update an issue\'s status';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			this.postOptions.codemarkTypes = ['issue'];
			callback();
		});
	}

	getCodemarkUpdateData () {
		return {
			status: RandomString.generate(8)
		};
	}
}

module.exports = TeamMemberUpdateIssueStatusTest;
