'use strict';

const RemoveUserTest = require('./remove_user_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

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
		BoundAsync.series(this, [
			super.run,
			this.wait,	// need to wait a bit since clearing lastReads happens after the response
			this.fetchRemovedUser
		], callback);
	}

	// wait a few seconds since clearing lastReads happens after the response
	wait (callback) {
		const time = this.mockMode ? 300 : 2000;
		setTimeout(callback, time);
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
