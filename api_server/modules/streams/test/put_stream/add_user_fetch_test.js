'use strict';

const AddUsersFetchTest = require('./add_users_fetch_test');

class AddUserFetchTest extends AddUsersFetchTest {

	get description () {
		return 'should properly update a stream when requested, when a user is added to the stream, checked by fetching the stream';
	}

	// get the users we want to add to the stream
	getAddedUsers () {
		return [this.users[2].user];
	}
}

module.exports = AddUserFetchTest;
