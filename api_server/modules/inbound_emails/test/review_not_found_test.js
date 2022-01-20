'use strict';

const ReviewReplyTest = require('./review_reply_test');
const ObjectId = require('mongodb').ObjectId;

class ReviewNotFoundTest extends ReviewReplyTest {

	get description () {
		return 'should return an error when trying to send an inbound email request with a to address that has a reviewID for a review that does not exist';
	}

	getExpectedError () {
		return {
			code: 'INBE-1008',
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			// inject a valid but non-existent review ID
			const index = this.data.to[0].address.indexOf('.');
			const fakeReviewId = ObjectId();
			this.data.to[0].address = fakeReviewId + this.data.to[0].address.slice(index);
			this.data.to.splice(1);
			callback();
		});
	}
}

module.exports = ReviewNotFoundTest;
