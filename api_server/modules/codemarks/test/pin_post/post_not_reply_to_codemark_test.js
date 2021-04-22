'use strict';

const PinPostTest = require('./pin_post_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class PostNotReplyToCodemarkTest extends PinPostTest {

	constructor (options) {
		super(options);
		this.noReply = true;
	}

	get description () {
		return 'should return an error when trying to pin a post to a codemark but the post isn\'t a reply to that codemark';
	}

	getExpectedError () {
		return {
			code: 'CMRK-1000'
		};
	}

	createReply (callback) {
		BoundAsync.series(this, [
			this.createOtherPost,
			this.createReplyToOtherPost
		], callback);
	}

	createOtherPost (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherPost = response.post;
				callback();
			},
			{
				streamId: this.teamStream.id,
				token: this.users[1].accessToken
			}
		);
	}

	createReplyToOtherPost (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.replyPost = response.post;
				callback();
			},
			{
				streamId: this.teamStream.id,
				parentPostId: this.otherPost.id,
				token: this.users[1].accessToken
			}
			
		);
	}
}

module.exports = PostNotReplyToCodemarkTest;
