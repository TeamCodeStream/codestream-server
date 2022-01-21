'use strict';

const ReviewFollowersMentionedTest = require('./review_followers_mentioned_test');
const ObjectId = require('mongodb').ObjectId;

class InvalidReviewMentionTest extends ReviewFollowersMentionedTest {

	get description () {
		return 'should return an error if an unknown user is mentioned for a review created with a post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			reason: 'one or more mentioned users are not on the team'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.mentionedUserIds.push(ObjectId());
			callback();
		});
	}
}

module.exports = InvalidReviewMentionTest;
