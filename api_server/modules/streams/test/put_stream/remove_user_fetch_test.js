'use strict';

const RemoveUsersFetchTest = require('./remove_users_fetch_test');

class RemoveUserFetchTest extends RemoveUsersFetchTest {

	get description () {
		return 'should properly update a stream when requested, when a user is removed from the stream, checked by fetching the stream';
	}

	// get the users we want to remove from the stream
	getRemovedUsers () {
		return [this.users[2].user];
	}
}

module.exports = RemoveUserFetchTest;
