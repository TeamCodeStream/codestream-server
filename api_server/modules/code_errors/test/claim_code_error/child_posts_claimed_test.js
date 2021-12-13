'use strict';

const ClaimCodeErrorTest = require('./claim_code_error_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class ChildPostsClaimedTest extends ClaimCodeErrorTest {

	get description () {
		return 'when a code error is claimed by a team, all the child and grandchild posts should be claimed as well';
	}

	before (callback) {
		this.numChildPosts = 7;
		BoundAsync.series(this, [
			super.before,
			this.createChildPosts
		], callback);
	}

	run (callback) {
		super.run(error => {
			 if (error) { return callback(error); }
			 this.validateChildPosts(callback);
		});
	}

	createChildPosts (callback) {
		this.childPosts = [];
		this.modifiedAfter = Date.now();
		BoundAsync.timesSeries(
			this,
			this.numChildPosts,
			this.createChildPost,
			callback
		);
	}

	createChildPost (n, callback) {
		const { objectId, objectType, accountId } = this.nrCommentResponse.post;
		const data = this.nrCommentFactory.getRandomNRCommentData();
		const parentPostId = n % 2  === 1 ? 
			this.childPosts[n - 1].id :
			this.nrCommentResponse.codeStreamResponse.codeErrorPost.id;
		Object.assign(data, {
			accountId,
			objectId,
			objectType,
			parentPostId
		});

		// the author of the comment is random, unless we are testing existing users
		// as foreign user
		if (this.childPostByUser && this.childPostByUser[n]) {
			data.creator = {
				email: this.users[this.childPostByUser[n]].user.email
			};
		} 

		this.doApiRequest(
			{
				method: 'post',
				path: `/nr-comments`,
				data,
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': data.accountId,
						'X-CS-Want-CS-Response': this.apiConfig.sharedSecrets.commentEngine
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				const post = response.codeStreamResponse.post;
				this.childPosts.push(post);
				this.expectedData.codeError.followerIds.push(post.creatorId);
				if (
					!this.childPostByUser ||
					this.childPostByUser[n] === undefined ||
					!this.team.memberIds.includes(post.creatorId)
				) {
					this.expectedData.team.$addToSet.memberIds.push(post.creatorId);
					this.expectedData.team.$addToSet.foreignMemberIds.push(post.creatorId);
				} 
				callback();
			}
		);
		
	}

	restoreData (callback) {
		this.data = this.savedData;
		callback();
	}

	validateResponse (data) {
		const { post, codeError, stream } = data;
		const lastPostId = this.childPosts[this.numChildPosts - 1].id;
		['modifiedAt', 'lastReplyAt', 'lastActivityAt'].forEach(attr => {
			Assert(codeError[attr] >= this.modifiedAfter, `codeError.${attr} not greater than or equal to claim time`);
			this.expectedData.codeError[attr] = codeError[attr];
		});
		Assert(post.modifiedAt >= this.modifiedAfter, `post.modifiedAt not greater than or equal to claim time`);
		this.expectedData.post.modifiedAt = post.modifiedAt;
		this.expectedData.codeError.numReplies = this.expectedData.post.numReplies = this.numChildPosts + 1;
		Assert.strictEqual(stream.mostRecentPostId, lastPostId, 'stream mostRecentPostId not set to last post');
		Assert.strictEqual(stream.sortId, lastPostId, 'stream sortId not set to last post');
		Assert(stream.modifiedAt >= this.modifiedAfter, `stream.modifiedAt not greater than or equal to claim time`);
		this.expectedData.stream.modifiedAt = stream.modifiedAt;
		Assert(stream.mostRecentPostCreatedAt >= this.modifiedAfter, `stream.mostRecentPostCreatedAt not greater than or equal to claim time`);
		this.expectedData.stream.mostRecentPostCreatedAt = stream.mostRecentPostCreatedAt;
		this.expectedData.stream.mostRecentPostId = this.expectedData.stream.sortId = lastPostId;
		this.expectedData.post.version = this.expectedData.codeError.version = this.expectedData.stream.version = this.numChildPosts + 1;
		super.validateResponse(data);
	}

	validateChildPosts (callback) {
		const ids = this.childPosts.map(post => post.id);
		const ids_param = ids.join(',');
		this.doApiRequest(
			{
				method: 'get',
				path: `/posts?teamId=${this.team.id}&ids=${ids_param}`,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.equal(response.posts.length, ids.length, 'did not get back expected number of posts');
				response.posts.forEach(post => {
					Assert.strictEqual(post.teamId, this.team.id, 'post found with teamId not set to the ID of the team');
				});
				callback();
			}
		);
	}
}

module.exports = ChildPostsClaimedTest;
