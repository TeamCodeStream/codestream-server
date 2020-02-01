'use strict';

const PostReplyTest = require('../post_reply_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class ReviewSecondReplyTest extends PostReplyTest {

	get description () {
		return 'parent post and review should get numReplies incremented when a second reply is created for that post';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.wantReview = true;
			callback();
		});
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// this posts the reply and checks the result, but then...
			this.createSecondReply,	// create another reply
			this.checkReview	// ...we'll check the review 
		], callback);
	}

	// create a second repy, to test that numReplies gets incremented even if hasReplies is set
	createSecondReply (callback) {
		this.postFactory.createRandomPost(
			callback,
			{
				streamId: this.stream.id,
				token: this.users[1].accessToken,
				parentPostId: this.postData[0].post.id
			}
		);
	}

	// check the review associated with the parent post
	checkReview (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/reviews/' + this.postData[0].review.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				// confirm the numReplies attribute has been incremented ... again
				Assert.equal(response.review.numReplies, 2, 'numReplies should be 2');
				callback();
			}
		);
	}
}

module.exports = ReviewSecondReplyTest;
