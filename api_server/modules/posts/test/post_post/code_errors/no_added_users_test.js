'use strict';

const CodeErrorTest = require('./code_error_test');
const Assert = require('assert');

class NoAddedUsersTest extends CodeErrorTest {

	get description () {
		return 'should ignore added users if a post is sent with a code error and added user info';
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

	validateResponse (data) {
		Assert(!data.users, 'response data has users');
		super.validateResponse(data);
	}
}

module.exports = NoAddedUsersTest;
