'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class UnreadObjectStreamTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.postOptions.numPosts = 5;
		this.postOptions.creatorIndex = 1;
		this.postOptions.postData.push({
			wantCodeError: true
		});
		for (let i = 1; i < 5; i++) {
			this.postOptions.postData.push({
				replyTo: 0
			});
		}
	}

	get description () {
		return 'should set lastReads for the stream of a post from an object stream when the post is marked as unread';
	}

	get method () { 
		return 'put';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.markRead,
			this.setExpectedData
		], callback);
	}

	// mark the stream as read
	markRead (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/read/' + this.postData[0].codeError.streamId,
				token: this.token
			},
			callback
		);
	}

	setExpectedData (callback) {
		const unreadPostNum = 3;
		const unreadPost = this.postData[unreadPostNum].post;
		const lastReadPost = this.postData[unreadPostNum - 1].post;
		this.path = '/unread/' + unreadPost.id;
		this.updatedAt = Date.now();
		this.expectedData = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$set: {
					[`lastReads.${this.postData[0].codeError.streamId}`]: lastReadPost.seqNum,
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

	validateResponse (data) {
		Assert(data.user.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		this.expectedData.user.$set.modifiedAt = data.user.$set.modifiedAt;
		Assert.deepEqual(data, this.expectedData, 'response not correct');
	}
}

module.exports = UnreadObjectStreamTest;
