'use strict';

const GetStreamsTest = require('./get_streams_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class GetUnreadStreamsTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when asking for streams with unread messages';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,		// set up standard test conditions
			this.createPosts 	// create posts in some of the streams, the current user hasn't read these posts so we expect these streams
		], callback);
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// set for fetching streams with "unread" messages
		this.path = `/streams?teamId=${this.team.id}&unread`;
		callback();
	}

	// create posts in some of the streams we created
	createPosts (callback) {
		// we'll select a subset of the stream we created, then create posts there ... 
		// we then expect only those streams
		const myStreams = this.streamsByTeam[this.team.id].filter(stream => {
			return stream.memberIds.includes(this.currentUser.user.id);
		});
		this.expectedStreams = myStreams.slice(1, 3);
		BoundAsync.forEach(
			this,
			this.expectedStreams,
			this.createPostInStream,
			callback
		);
	}

	// create a post in the given stream
	createPostInStream (stream, callback) {
		this.postFactory.createRandomPost(
			callback,
			{
				teamId: this.team.id,
				streamId: stream.id,
				token: this.users[1].accessToken	// have the "other" user create the post
			}
		);
	}
}

module.exports = GetUnreadStreamsTest;
