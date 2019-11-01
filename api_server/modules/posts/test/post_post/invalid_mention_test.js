'use strict';

const FollowersMentionedTest = require('./followers_mentioned_test');
const ObjectID = require('mongodb').ObjectID;

class InvalidMentionTest extends FollowersMentionedTest {

	get description () {
		return 'should return an error if an unknown user is mentioned for a codemark created with a post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'followers must contain only users on the team'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.mentionedUserIds.push(ObjectID());
			callback();
		});
	}
}

module.exports = InvalidMentionTest;
