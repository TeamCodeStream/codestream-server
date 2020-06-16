'use strict';

const ResendConfirmEmailTest = require('./resend_confirm_email_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class AlreadyRegisteredEmailTest extends ResendConfirmEmailTest {

	constructor (options) {
		super(options);
		this.noToken = true;
	}

	get description () {
		return 'should send an already-registered email when a user sends a resend confirm request and the user is already registered';
	}

	// make the data that will be used during the test
	makeData (callback) {
		// in between registering the user and doing the resend confirm request, we'll confirm the user
		BoundAsync.series(this, [
			this.registerUser,
			this.confirmUser,
			this.resendConfirm
		], callback);
	}
    
	// confirm the user that we already sent a register request for
	confirmUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: {
					token: this.originalToken
				}
			},
			callback
		);
	}

	// generate the message that starts the test
	generateMessage (callback) {
		// in this case the email type should be for an already-registered user
		super.generateMessage(() => {
			this.message.type = 'alreadyRegistered';
			callback();
		});
	}
}

module.exports = AlreadyRegisteredEmailTest;
