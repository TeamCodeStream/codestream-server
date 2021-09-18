'use strict';

const CodeErrorFollowersMentionedTest = require('./code_error_followers_mentioned_test');
const ObjectID = require('mongodb').ObjectID;

class InvalidCodeErrorMentionTest extends CodeErrorFollowersMentionedTest {

	get description () {
		return 'should return an error if an unknown user is mentioned for a code error created with a post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'followers must contain only users on the team'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			const id = ObjectID();
			this.data.mentionedUserIds.push(id/*ObjectID()*/);
			callback();
		});
	}
}

module.exports = InvalidCodeErrorMentionTest;
