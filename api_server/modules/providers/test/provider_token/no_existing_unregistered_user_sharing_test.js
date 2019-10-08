'use strict';

const IdentityMatchErrorTest = require('./identity_match_error_test');

class NoExistingUnregisteredUserSharingTest extends IdentityMatchErrorTest {

	constructor (options) {
		super(options);
		this.expectError = 'PRVD-1005';
	}

	get description () {
		return `should redirect to an error page and return a signup token with an error when completing a ${this.provider} authorization flow when sharing model is in effect and an unregistered user with matching email is already on CodeStream`;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numUnregistered = 1;
			callback();
		});
	}

	// get parameter to use in the provider-auth request that kicks the authentication off
	getProviderAuthParameters () {
		const parameters = super.getProviderAuthParameters();
		this.sharing = true;
		parameters.sharing = true;
		return parameters;
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		parameters._mockEmail = this.users[0].user.email;
		return parameters;
	}
}

module.exports = NoExistingUnregisteredUserSharingTest;
