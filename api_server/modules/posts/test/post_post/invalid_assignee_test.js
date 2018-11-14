'use strict';

const IssueWithAssigneesTest = require('./issue_with_assignees_test');
const ObjectID = require('mongodb').ObjectID;

class InvalidAssigneeTest extends IssueWithAssigneesTest {

	get description () {
		return 'should return an error when attempting to create a post with an issue codemark with an invalid assignee';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'assignees must contain only users on the team'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codemark.assignees.push(ObjectID());
			callback();
		});
	}
}

module.exports = InvalidAssigneeTest;
