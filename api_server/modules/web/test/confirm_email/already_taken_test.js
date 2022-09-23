'use strict';

const ConfirmEmailTest = require('./confirm_email_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class AlreadyTakenTest extends ConfirmEmailTest {

	get description () {
		const which = this.isRegistered ? 'registered' : 'unregistered';
		return `should redirect to an error page when sending a confirm change of email request for an email already taken by a ${which} user`;
	}

	init (callback) {
		BoundAsync.series(this, [
			super.init,
			this.registerUser,
			this.confirmUser
		], callback);
	}

	registerUser (callback) {
		const userData = this.userFactory.getRandomUserData();
		userData.email = this.newEmail;
		userData._confirmationCheat = this.apiConfig.sharedSecrets.confirmationCheat;
		this.userFactory.registerUser(
			userData,
			(error, response) => {
				if (error) { return callback(error); }
				this.userResponse = response;
				callback();
			}
		);
	}

	confirmUser (callback) {
		if (!this.isRegistered) { return callback(); }
		this.userFactory.confirmUser(
			{ 
				email: this.newEmail,
				confirmationCode: this.userResponse.user.confirmationCode
			},
			callback
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data, '/web/confirm-email-error?error=USRC-1025', 'improper redirect');
	}
}

module.exports = AlreadyTakenTest;
