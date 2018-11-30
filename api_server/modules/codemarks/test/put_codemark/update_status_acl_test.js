'use strict';

const TeamMemberUpdateIssueStatusTest = require('./team_member_update_issue_status_test');
const RandomString = require('randomstring');

class UpdateStatusACLTest extends TeamMemberUpdateIssueStatusTest {

	get description () {
		return 'should return an error when trying to update the status of an issue with another update';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only the author.* can update a codemark'
		};
	}

	getCodemarkUpdateData () {
		const data = super.getCodemarkUpdateData();
		data.color = RandomString.generate(8);
		return data;
	}
}

module.exports = UpdateStatusACLTest;
