'use strict';

const PostProviderTokenTest = require('./post_provider_token_test');

class ExistingRegisteredUserTest extends PostProviderTokenTest {

	constructor(options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return `should return an error when setting a ${this.provider} token when a registered user with matching email is already on CodeStream`;
	}

	getExpectedError() {
		return {
			code: 'USRC-1006'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 1;
			callback();
		});
	}

	getRequestBody () {
		const body = super.getRequestBody();
		body._mockEmail = this.users[0].user.email;
		return body;
	}
}

module.exports = ExistingRegisteredUserTest;
