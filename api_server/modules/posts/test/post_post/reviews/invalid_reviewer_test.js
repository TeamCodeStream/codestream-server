'use strict';

const ReviewersTest = require('./reviewers_test');
const ObjectId = require('mongodb').ObjectId;

class InvalidReviewerTest extends ReviewersTest {

	get description () {
		return 'should return an error when attempting to create a post with a review with an invalid reviewer';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			reason: 'one or more mentioned users are not on the team'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.review.reviewers.push(ObjectId());
			callback();
		});
	}
}

module.exports = InvalidReviewerTest;
