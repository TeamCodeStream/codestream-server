'use strict';

const IdentityMatchTest = require('./identity_match_test');

class ExistingRegisteredUserTest extends IdentityMatchTest {

	get description () {
		return `should be ok to complete a ${this.provider} authorization flow when a registered user with matching email is already on CodeStream`;
	}


	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 1;
			callback();
		});
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		parameters._mockEmail = this.users[0].user.email;
		return parameters;
	}
}

module.exports = ExistingRegisteredUserTest;
