'use strict';

const ReviewersTest = require('./reviewers_test');
const ObjectID = require('mongodb').ObjectID;

class InvalidReviewerTest extends ReviewersTest {

	get description () {
		return 'should return an error when attempting to create a post with a review with an invalid reviewer';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'must contain only users on the team'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.review.reviewers.push(ObjectID());
			callback();
		});
	}
}

module.exports = InvalidReviewerTest;
