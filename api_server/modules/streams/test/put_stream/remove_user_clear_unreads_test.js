'use strict';

const RemoveUserTest = require('./remove_user_test');
const Assert = require('assert');

class RemoveUserClearUnreadsTest extends RemoveUserTest {

	get description () {
		return 'when a user is removed from a stream, should clear that user\'s lastReads for the stream';
	}

	// before the test runs...
	before (callback) {
		// do the usual test initialization, and create a post in the stream,
		// which should set a lastReads value for this stream for the current user
		super.before(error => {
			if (error) { return callback(error); }
			this.createPost(callback);
		});
	}

	// create a post in the test stream, which should set a lastReads value for this stream
	// for the current user
	createPost (callback) {
		this.postFactory.createRandomPost(
			callback,
			{
				streamId: this.stream._id,
				token: this.otherUserData.accessToken
			}
		);
	}

	// get array of users to remove from the stream
	getRemovedUsers () {
		return [this.currentUser];
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
				Assert.equal(typeof response.user.lastReads[this.stream._id], 'undefined', 'lastReads for the user was not deleted');
				callback();
			}
		);
	}
}

module.exports = RemoveUserClearUnreadsTest;
