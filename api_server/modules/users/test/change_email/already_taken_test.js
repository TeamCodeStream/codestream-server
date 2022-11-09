'use strict';

const ChangeEmailTest = require('./change_email_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class AlreadyTakenTest extends ChangeEmailTest {

	constructor (options) {
		super(options);
		this.errorExpected = (
			(
				this.oneUserPerOrg &&
				this.inCompany
			) ||
			!this.oneUserPerOrg
		);

		if (this.inCompany) {
			this.userOptions.numRegistered = 2;
			this.teamOptions.creatorIndex = 1;
			if (!this.oneUserPerOrg) {
				this.teamOptions.members = [];
			}
		}
	}

	get description () {
		const which = this.isRegistered ? 'registered' : 'unregistered';
		const inAnOrg = this.inCompany ? ' in a company' : '';
		const oneUserPerOrg = this.oneUserPerOrg ? 'under one-user-per-org, ' : '';
		const behavior = this.errorExpected ? 'return an error' : 'return an OK response';
		return `${oneUserPerOrg}should ${behavior} when submitting a request to change email to the email of another ${which} user${inAnOrg}`;
	}

	getExpectedError () {
		return this.errorExpected ? {
			code: 'USRC-1025'
		} : null;
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.registerUser,
			this.confirmUser,
			this.inviteUser
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
		if (!this.inCompany) { return callback(); }
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.userResponse.user.email,
					teamId: this.team.id
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}
}

module.exports = AlreadyTakenTest;
