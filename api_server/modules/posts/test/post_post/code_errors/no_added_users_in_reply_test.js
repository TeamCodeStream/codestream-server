'use strict';

const CodeErrorReplyTest = require('./code_error_reply_test');

class NoAddedUsersInReplyTest extends CodeErrorReplyTest {

	get description () {
		return 'should return an error if a reply to a code error is sent with added user info';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			reason: 'cannot add users to a stream that is not a team stream'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.addedUsers = [
				this.userFactory.randomEmail(),
				this.userFactory.randomEmail()
			];
			callback();
		});
	}
}

module.exports = NoAddedUsersInReplyTest;
