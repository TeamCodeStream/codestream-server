'use strict';

const ReviewFollowersMentionedTest = require('./review_followers_mentioned_test');
const ObjectID = require('mongodb').ObjectID;

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
			this.data.mentionedUserIds.push(ObjectID());
			callback();
		});
	}
}

module.exports = InvalidReviewMentionTest;
