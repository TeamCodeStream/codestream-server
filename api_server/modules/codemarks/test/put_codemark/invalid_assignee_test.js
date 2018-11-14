'use strict';

const SetAssigneesTest = require('./set_assignees_test');
const ObjectID = require('mongodb').ObjectID;

class InvalidAssigneeTest extends SetAssigneesTest {

	get description () {
		return 'should return an error when attempting to create a post with an issue codemark with an invalid assignee';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'assignees must contain only users on the team'
		};
	}

	getCodemarkUpdateData () {
		const data = super.getCodemarkUpdateData();
		data.assignees.push(ObjectID());
		return data;
	}
}

module.exports = InvalidAssigneeTest;
