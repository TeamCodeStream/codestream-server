'use strict';

const Assert = require('assert');
const PutStreamTest = require('./put_stream_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ArchiveClearUnreadsTest extends PutStreamTest {

	get description () {
		return 'when a channel stream is archived, should clear lastReads for the stream for all members of the stream';
	}

	setTestOptions (callback) {
		this.expectedVersion = 3;
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}

	// get the data for the stream update
	getUpdateData () {
		return {
			isArchived: true
		};
	}

	// run the actual test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.wait,	// need to wait a bit since clearing lastReads happens after the response
			this.fetchCurrentUser
		], callback);
	}

	// wait a few seconds since clearing lastReads happens after the response
	wait (callback) {
		const time = this.mockMode ? 300 : 2000;
		setTimeout(callback, time);
	}

	// fetch the current user, and validate that the lastReads
	// value for the user and this stream has been cleared
	fetchCurrentUser (callback) {
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

module.exports = ArchiveClearUnreadsTest;
