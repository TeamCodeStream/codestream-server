'use strict';

var GetStreamsTest = require('./get_streams_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class GetUnreadStreamsTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when asking for streams with unread messages';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createPosts
		], callback);
	}

	setPath (callback) {
		this.path = `/streams?teamId=${this.myTeam._id}&repoId=${this.myRepo._id}&unread`;
		callback();
	}

	createPosts (callback) {
		let streams = this.streamsByRepo[this.myRepo._id];
		this.myStreams = streams.slice(0, 2);
		BoundAsync.forEach(
			this,
			this.myStreams,
			this.createPostInStream,
			callback
		);
	}

	createPostInStream (stream, callback) {
		this.postFactory.createRandomPost(
			callback,
			{
				teamId: this.myTeam._id,
				streamId: stream._id,
				token: this.otherUserData.accessToken
			}
		);
	}
}

module.exports = GetUnreadStreamsTest;
