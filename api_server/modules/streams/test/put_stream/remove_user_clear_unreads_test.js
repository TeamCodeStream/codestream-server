'use strict';

const RemoveUserTest = require('./remove_user_test');
const Assert = require('assert');

class RemoveUserClearUnreadsTest extends RemoveUserTest {

	get description () {
		return 'when a user is removed from a stream, should clear that user\'s lastReads for the stream';
	}

	setTestOptions (callback) {
		this.expectedVersion = 3;
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}

	// get array of users to remove from the stream
	getRemovedUsers () {
		return [this.currentUser.user];
	}

	// run the actual test...
	run (callback) {
		// run the usual test, but then fetch the user object for the user that was
		// removed from the stream, we should see no lastReads for this stream
		super.run(error => {
			if (error) { return callback(error); }
			this.fetchRemovedUser(callback);
		});
	}

	// fetch the user that was removed from the stream, and validate that the lastReads
	// value for the user and this stream has been cleared
	fetchRemovedUser (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/users/me',
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.equal(typeof response.user.lastReads[this.stream.id], 'undefined', 'lastReads for the user was not deleted');
				callback();
			}
		);
	}
}

module.exports = RemoveUserClearUnreadsTest;
