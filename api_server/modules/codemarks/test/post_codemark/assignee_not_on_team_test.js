'use strict';

const IssueWithAssigneesTest = require('./issue_with_assignees_test');

class AssigneeNotOnTeamTest extends IssueWithAssigneesTest {

	get description () {
		return 'should return an error when attempting to create an issue codemark with an assignee that is not on the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'assignees must contain only users on the team'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [0];
			callback();
		});
	}
}

module.exports = AssigneeNotOnTeamTest;
