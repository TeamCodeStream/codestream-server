'use strict';

const AddAssigneesFetchTest = require('./add_assignees_fetch_test');

class AddAssigneeFetchTest extends AddAssigneesFetchTest {

	get description () {
		return 'should properly update a code error when requested, when an assignee is added to the code error, checked by fetching the code error';
	}

	// get the assignees we want to add to the code error
	getAddedUsers () {
		return [this.users[2].user];
	}
}

module.exports = AddAssigneeFetchTest;
