'use strict';

const Assert = require('assert');
const PutStreamTest = require('./put_stream_test');

class ArchiveClearUnreadsTest extends PutStreamTest {

	get description () {
		return 'when a channel stream is archived, should clear lastReads for the stream for all members of the stream';
	}

	getExpectedFields () {
		return { 
			stream: ['isArchived', 'modifiedAt']
		};
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

	// get the data for the stream update
	getUpdateData () {
		return {
			isArchived: true
		};
	}

	// create a post in the test stream, which should set a lastReads value for this stream
	// for the current user
	createPost (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.expectedStream.mostRecentPostId = response.post._id;
				this.expectedStream.mostRecentPostCreatedAt = response.post.createdAt;
				this.expectedStream.sortId = response.post._id;
				callback();
			},
			{
				streamId: this.stream._id,
				token: this.otherUserData.accessToken
			}
		);
	}

	// run the actual test...
	run (callback) {
		// run the usual test, but then fetch the user object for the current user,
		// we should see no lastReads for this stream
		super.run(error => {
			if (error) { return callback(error); }
			this.fetchCurrentUser(callback);
		});
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
				Assert.equal(typeof response.user.lastReads[this.stream._id], 'undefined', 'lastReads for the user was not deleted');
				callback();
			}
		);
	}
}

module.exports = ArchiveClearUnreadsTest;
