'use strict';

const PostProviderTokenTest = require('./post_provider_token_test');

class ExistingUnregisteredUserTest extends PostProviderTokenTest {

	get description () {
		return `should be ok to set a ${this.provider} token when an unregistered user with matching email is already on CodeStream`;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numUnregistered = 1;
			callback();
		});
	}

	getRequestBody () {
		const body = super.getRequestBody();
		const userIndex = this.testUserIndex || 0;
		body._mockEmail = this.users[userIndex].user.email;
		return body;
	}
}

module.exports = ExistingUnregisteredUserTest;
