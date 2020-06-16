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
			reason: 'only the creator of the review can make this update'
		};
	}

	getReviewUpdateData () {
		const data = super.getReviewUpdateData();
		data.status = RandomString.generate(10);
		data.text = RandomString.generate(100);
		return data;
	}
}

module.exports = UpdateStatusACLTest;
