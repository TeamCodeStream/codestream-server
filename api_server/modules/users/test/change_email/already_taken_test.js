'use strict';

const ChangeEmailTest = require('./change_email_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class AlreadyTakenTest extends ChangeEmailTest {

	get description () {
		const which = this.isRegistered ? 'registered' : 'unregistered';
		return `should return an error when submitting a request to change email and the new email already belongs to a ${which} user`;
	}

	getExpectedError () {
		return {
			code: 'USRC-1025'
		};
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.registerUser,
			this.confirmUser,
			this.createCompany
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

	createCompany (callback) {
		if (!this.inCompany) { return callback(); }
		this.companyFactory.createRandomCompany(callback, { token: this.confirmResponse.accessToken });
	}
}

module.exports = AlreadyTakenTest;
