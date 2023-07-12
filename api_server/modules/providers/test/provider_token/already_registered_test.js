'use strict';

const IdentityMatchErrorTest = require('./identity_match_error_test');

class AlreadyRegisteredTest extends IdentityMatchErrorTest {

	constructor (options) {
		super(options);
		this.expectError = 'USRC-1006';
		this.isRegistered = true;
	}

	get description () {
		return `should redirect to an error page and return a signup token with an error when completing a ${this.provider} sign-up flow when a matching registered user is found`;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			if (this.userIsInvited) {
				this.teamOptions.creatorIndex = 1;
				this.userOptions.numRegistered = 2;
				this.userOptions.numUnregistered = this.isRegistered ? 0 : 1;
				this.userIndex = this.isRegistered ? 0 : 2;
			} else {
				this.userOptions.numRegistered = this.isRegistered ? 1 : 0;
				this.userOptions.numUnregistered = this.isRegistered ? 0 : 1;
				this.userIndex = 0;
			}
			callback();
		});
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		parameters._mockEmail = this.users[this.userIndex].user.email;
		return parameters;
	}
}

module.exports = AlreadyRegisteredTest;
