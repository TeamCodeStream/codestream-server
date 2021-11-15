'use strict';

const PostReplyTest = require('../post_reply_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class ReviewNumRepliesTest extends PostReplyTest {

	constructor (options) {
		super(options);
		this.expectedSeqNum = 3;
		this.expectedStreamVersion = 4;
	}

	get description () {
		return 'parent post\'s review should get its numReplies attribute incremented when a reply is created for a post with a review';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			Object.assign(this.postOptions, {
				wantReview: true,
				wantMarkers: 5,
				numChanges: 2
			});
			callback();
		});
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// this posts the reply and checks the result, but then...
			this.checkReview	// ...we'll check the review
		], callback);
	}

	validateResponse (data) {
		const now = Date.now();
		const expectedReviews = [{
			id: this.postData[0].review.id,
			_id: this.postData[0].review._id, // DEPRECATE ME
			$set: {
				numReplies: 1,
				version: 2
			},
			$addToSet: {
				followerIds: [
					this.currentUser.user.id
				]
			},
			$version: {
				before: 1,
				after: 2
			}
		}];
		['modifiedAt', 'lastActivityAt', 'lastReplyAt'].forEach(attribute => {
			Assert(data.reviews[0].$set[attribute] >= this.postCreatedAfter, `${attribute} not set to after post was created`);
			expectedReviews[0].$set[attribute] = data.reviews[0].$set[attribute];
		});
		Assert.deepStrictEqual(data.reviews, expectedReviews, 'updated reviews are not correct');
		super.validateResponse(data);
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
				Assert.equal(response.review.numReplies, 1, 'numReplies should be 1');
				callback();
			}
		);
	}
}

module.exports = ReviewNumRepliesTest;
