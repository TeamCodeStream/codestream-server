// base class for many tests of the "POST /nr-comments" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class CreateNRCommentTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the expected response when a request is made to create a New Relic comment';
	}

	get method () {
		return 'post';
	}

	// before the test runs...
	before (callback) {
		this.path = '/nr-comments';
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify id, createdAt, and modifiedAt were created, and then set it so the deepEqual works
		const post = data.post;
		Assert(post.id, 'returned post has no ID');
		this.expectedResponse.post.id = post.id;
		Assert(post.parentPostId, 'returned post has no parentPostId');
		this.expectedResponse.post.parentPostId = this.expectedParentPostId || post.parentPostId;
		Assert(post.creatorId, 'returned post has no creatorId');
		this.expectedResponse.post.creatorId = this.expectedCreatorId || post.creatorId;
		this.expectedResponse.post.userMaps[post.creatorId] = this.expectedResponse.post.userMaps.placeholder;
		delete this.expectedResponse.post.userMaps.placeholder;
		Assert(post.createdAt >= this.createdAfter, 'createdAt is not greater than before the comment was created');
		Assert(post.modifiedAt >= post.createdAt, 'modifiedAt is not greater than or equal to createdAt');
		this.expectedResponse.post.createdAt = post.createdAt;
		this.expectedResponse.post.modifiedAt = post.modifiedAt;
		this.validateMentions(post);
		Assert.deepStrictEqual(data, this.expectedResponse, 'response data is not correct');
	}

	validateMentions (post) {
		Assert((post.mentionedUsers || []).length === (this.expectedResponse.post.mentionedUsers || []).length, 
			'response does not include all mentioned users');
		Assert((post.mentionedUserIds || []).length === (this.expectedResponse.post.mentionedUserIds || []).length,
			'response does not include all mentioned user ids');
		(this.expectedResponse.post.mentionedUsers || []).sort((a, b) => {
			return a.email.localeCompare(b.email);
		});
		(post.mentionedUsers || []).sort((a, b) => {
			return a.email.localeCompare(b.email);
		});
		
		const userMapIds = Object.keys(post.userMaps).sort();
		const expectedUserMapIds = [
			this.expectedCreatorId || post.creatorId,
			...(post.mentionedUserIds || [])
		].sort();
		Assert.deepStrictEqual(userMapIds, expectedUserMapIds, 'incorrect keys for user maps');

		const realMentionedUserIds = [];
		const realUserMaps = {
			[post.creatorId]: { ...post.creator }
		};
		for (let i = 0; i < (this.data.mentionedUsers || []).length; i++) {
			const email = this.data.mentionedUsers[i].email;
			const u = post.mentionedUsers.find(mu => mu.email === email);
			Assert(u, 'no mentioned user in the response matches the mentioned user in the request');
			const realUserId = Object.keys(post.userMaps).find(userId => post.userMaps[userId].email === email);
			Assert(realUserId, 'mentioned user is not reflected in the user map');
			realMentionedUserIds.push(realUserId);
			realUserMaps[realUserId] = { ...post.userMaps[realUserId] };
		}
		realMentionedUserIds.sort();
		this.expectedResponse.post.mentionedUserIds = realMentionedUserIds;
		this.expectedResponse.post.userMaps = realUserMaps;
	}
}

module.exports = CreateNRCommentTest;
