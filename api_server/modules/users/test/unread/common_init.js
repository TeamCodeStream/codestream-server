// base class for many tests of the "PUT /unread/:postId" requests

'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
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
		if (this.skipMarkRead) { 
			return callback(); 
		}
		this.doApiRequest(
			{
				method: 'put',
				path: '/read/' + this.teamStream.id,
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
					[`lastReads.${this.teamStream.id}`]: this.lastReadPost.seqNum,
					version: 5
				},
				$version: {
					before: 4,
					after: 5
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
