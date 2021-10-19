'use strict';

const ReplyToAttachedCodemarkTest = require('./reply_to_attached_codemark_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class ReplyToAttachedCodemarkNumRepliesTest extends ReplyToAttachedCodemarkTest {

	get description () {
		return 'grandparent post\'s review should get its numReplies attribute incremented when a reply is created for a codemark which is itself a reply to a review';
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// this posts the reply and checks the result, but then...
			this.checkReview	// ...we'll check the review
		], callback);
	}

	// check the review associated with the parent post
	checkReview (callback) {
		// get the review
		this.doApiRequest(
			{
				method: 'get',
				path: '/reviews/' + this.postData[0].review.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				// confirm the numReplies attribute has been incremented
				Assert.equal(response.review.numReplies, 2, 'numReplies should be 2');
				callback();
			}
		);
	}
}

module.exports = ReplyToAttachedCodemarkNumRepliesTest;
