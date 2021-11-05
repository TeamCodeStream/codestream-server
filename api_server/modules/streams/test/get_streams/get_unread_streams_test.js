'use strict';

const GetStreamsTest = require('./get_streams_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class GetUnreadStreamsTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when asking for streams with unread messages';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,		// set up standard test conditions
			this.markAllRead,	// mark all the streams created so far as read
			this.createPosts 	// create posts in some of the streams, the current user hasn't read these posts so we expect these streams
		], callback);
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// set for fetching streams with "unread" messages
		this.path = `/streams?teamId=${this.team.id}&unread`;
		callback();
	}

	// mark all the streams created so far as read
	markAllRead (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/read/all',
				token: this.token
			},
			callback
		);
	}

	// create posts in some of the streams we created
	createPosts (callback) {
		// we can create posts in the team stream, and object streams
		this.expectedStreams = this.getExpectedStreams();

		// we'll select a subset of the stream we created, then create posts there ... 
		// we then expect only those streams
		this.expectedStreams = this.expectedStreams.slice(0, 3);
		BoundAsync.forEachSeries(
			this,
			this.expectedStreams,
			this.createPostInStream,
			callback
		);
	}

	// create a post in the given stream
	createPostInStream (stream, callback) {
		let parentPostId;
		if (stream.type === 'object') {
			parentPostId = stream.post.id;
		}
		this.postFactory.createRandomPost(
			callback,
			{
				teamId: this.team.id,
				streamId: stream.id,
				parentPostId,
				token: this.users[1].accessToken	// have the "other" user create the post
			}
		);
	}
}

module.exports = GetUnreadStreamsTest;
