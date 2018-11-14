'use strict';

const SetAssigneesTest = require('./set_assignees_test');

class AssigneeNotOnTeamTest extends SetAssigneesTest {

	get description () {
		return 'should return an error when attempting to create a post with an issue codemark with an assignee that is not on the team';
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
