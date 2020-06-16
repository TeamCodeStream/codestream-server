// base class for many tests of the "PUT /unread/:postId" requests

'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CommonInit {

	init (callback) {
		this.streamOptions.creatorIndex = 1;
		this.postOptions.numPosts = 5;
		this.postOptions.creatorIndex = 1;
		this.unreadPost = 2;
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.markRead,
			this.setExpectedData
		], callback);
	}

	// mark the stream as read
	markRead (callback) {
		if (!this.stream.memberIds.includes(this.currentUser.user.id)) {
			return callback();
		}
		this.doApiRequest(
			{
				method: 'put',
				path: '/read/' + this.stream.id,
				token: this.token
			},
			callback
		);
	}

	setExpectedData (callback) {
		this.lastReadPost = this.postData[this.unreadPost - 1].post;
		this.expectedData = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$set: {
					[`lastReads.${this.stream.id}`]: this.lastReadPost.seqNum,
					version: 7
				},
				$version: {
					before: 6,
					after: 7
				}
			}
		};
		callback();
	}

	// mark a given post as unread
	markUnread (callback) {
		const post = this.postData[this.unreadPost].post;
		this.doApiRequest(
			{
				method: 'put',
				path: '/unread/' + post.id,
				token: this.token
			},
			callback
		);
	}
}

module.exports = CommonInit;
