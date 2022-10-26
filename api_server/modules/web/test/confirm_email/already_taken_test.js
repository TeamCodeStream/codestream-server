'use strict';

const ConfirmEmailTest = require('./confirm_email_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class AlreadyTakenTest extends ConfirmEmailTest {

	get description () {
		const which = this.isRegistered ? 'registered' : 'unregistered';
		const inSameOrg = this.inSameOrg ? ' in the same org' : '';
		const oneUserPerOrg = this.oneUserPerOrg ? 'under one-user-per-org, ' : '';
		this.shouldFail = !this.oneUserPerOrg || this.inSameOrg;
		const behavior = this.shouldFail ? 'redirect to an error page' : 'change the user\'s email';
		return `${oneUserPerOrg}should ${behavior} when sending a confirm change of email request for an email already taken by a ${which} user${inSameOrg}`;
	}

	init (callback) {
		BoundAsync.series(this, [
			super.init,
			this.registerUser,
			this.confirmUser,
			this.inviteUser,
			this.acceptInvite
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
			(error, response) => {
				if (error) { return callback(error); }
				this.confirmResponse = response;
				callback();
			}
		);
	}

	inviteUser (callback) {
		if (!this.inSameOrg) {
			return callback();
		}
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.userResponse.user.email,
					teamId: this.team.id
				},
				token: this.currentUser.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.inviteResponse = response;
				callback();
			}
		);
	}

	acceptInvite (callback) {
		if (!this.inSameOrg || !this.oneUserPerOrg || !this.isRegistered) {
			return callback();
		}
		this.doApiRequest(
			{
				method: 'put',
				path: '/join-company/' + this.company.id,
				token: this.confirmResponse.accessToken
			},
			callback
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		if (this.shouldFail) {
			Assert.equal(data, '/web/confirm-email-error?error=USRC-1025', 'improper redirect');
		} else {
			Assert.equal(data, '/web/confirm-email-complete', 'improper redirect');
		}
	}
}

module.exports = AlreadyTakenTest;
