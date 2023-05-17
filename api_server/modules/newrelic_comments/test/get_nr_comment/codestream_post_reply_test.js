'use strict';

const GetNRCommentTest = require('./get_nr_comment_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class CodeStreamPostReplyTest extends GetNRCommentTest {

	get description () {
		return 'should return a New Relic comment when requested, when fetching a post that was created in CodeStream but is a reply to a New Relic object';
	}

	// before the test runs...
	before (callback) {
		this.ownedByTeam = true;
		BoundAsync.series(this, [
			super.before,
			this.getPost,
			this.makePostData,
			this.makePost,
		], callback);
	}

	getPost (callback) {
		// needed to get the stream ID
		this.doApiRequest(
			{
				method: 'get',
				path: `/posts/${this.nrCommentResponse.post.id}`,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.streamId = response.post.streamId;
				callback();
			}
		);
	}

	makePostData (callback) {
		this.postFactory.getRandomPostData(
			(error, data) => {
				if (error) { return callback(error); }
				this.postData = {
					...data,
					parentPostId: this.nrCommentResponse.post.id
				};
				callback();
			},
			{
				streamId: this.streamId
			}
		);
	}

	makePost (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: this.postData,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.path = `/nr-comments/${response.post.id}`;
				this.replyPostResponse = response;
				Object.assign(this.expectedResponse.post, {
					id: response.post.id,
					createdAt: response.post.createdAt,
					modifiedAt: response.post.modifiedAt,
					parentPostId: response.post.parentPostId,
					seqNum: response.post.seqNum,
					text: response.post.text
				});
				// under ONE_USER_PER_ORG, we can't duplicate the original post as easily,
				// because the connection between the original faux user poster and the user registering
				// with the same email isn't maintained
				this.expectedResponse.post.creatorId = this.users[1].user.id;
				this.expectedResponse.post.creator.username = this.users[1].user.username;
				this.expectedResponse.post.userMaps[this.users[1].user.id] =
					this.nrCommentResponse.post.userMaps[this.nrCommentResponse.post.creatorId];
				this.expectedResponse.post.userMaps[this.users[1].user.id].username = this.users[1].user.username;
				delete this.expectedResponse.post.userMaps[this.nrCommentResponse.post.creatorId];
				callback();
			}
		);
	}
}

module.exports = CodeStreamPostReplyTest;
