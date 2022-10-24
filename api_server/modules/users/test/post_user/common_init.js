// base class for many tests of the "POST /users" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const TestTeamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/test_team_creator');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		this.setOptions();
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.createForeignTeam,
			this.makeUserData		// make the data to be used during the request
		], callback);
	}

	setOptions () {
		this.existingRegisteredUserIndex = 2;
		this.existingUnregisteredUserIndex = 4;
		this.existingRegisteredUserOnTeamIndex = 1;
		this.existingUnregisteredUserOnTeamIndex = 3;
		Object.assign(this.userOptions, {
			numRegistered: 3,
			numUnregistered: 3
		});
		this.teamOptions.members = [0, 1, 3, 5];
	}

	createForeignTeam (callback) {
		if (!this.existingUserOnTeam) {
			return callback();
		}
		new TestTeamCreator({
			test: this,
			userOptions: {
				numRegistered: this.existingUserIsRegistered ? 1 : 0
			},
			teamOptions: {
				creatorToken: this.users[1].accessToken,
				numAdditionalInvites: this.existingUserIsRegistered ? 0 : 1,
				members: 'all'
			}
		}).create((error, data) => {
			if (error) { return callback(error); }
			this.existingUserTeam = data.team;
			this.existingUserCompany = data.company;
			this.foreignUsers = data.users;
			callback();
		});
	}

	// form the data for the user update
	makeUserData (callback) {
		this.data = {
			teamId: this.team.id
		};
		if (this.wantExistingUser) {
			if (this.existingUserOnTeam) {
				this.existingUserData = this.foreignUsers[0];
			}
			else {
				let index;
				if (this.existingUserAlreadyOnTeam) {
					index = this.existingUserIsRegistered ? 
						this.existingRegisteredUserOnTeamIndex :
						this.existingUnregisteredUserOnTeamIndex;
				}
				else {
					index = this.existingUserIsRegistered ? 
						this.existingRegisteredUserIndex : 
						this.existingUnregisteredUserIndex;
				}
				this.existingUserData = this.users[index];
			}
			this.data.email = this.existingUserData.user.email;
		}
		else {
			this.data.email = this.userFactory.randomEmail();
		}
		callback();
	}

	registerAndConfirmUser (callback) {
		BoundAsync.series(this, [
			this.registerUser,
			this.confirmUser
		], callback);
	}

	registerUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: {
					email: this.data.email,
					username: RandomString.generate(10),
					password: RandomString.generate(10),
					_confirmationCheat: this.apiConfig.sharedSecrets.confirmationCheat
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.registerResponse = response;
				callback();
			}
		);
	}

	confirmUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: {
					email: this.data.email,
					confirmationCode: this.registerResponse.user.confirmationCode
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.confirmResponse = response;
				callback();
			}
		);
	}

	acceptInviteAndLogin (callback) {
		BoundAsync.series(this, [
			this.acceptInvite,
			this.loginToCompany
		], callback);
	}


	acceptInvite (callback) {
		const token = (this.confirmResponse && this.confirmResponse.accessToken) || this.existingUserData.accessToken;
		this.doApiRequest(
			{
				method: 'put',
				path: '/join-company/' + this.company.id,
				token,
				requestOptions: {
					headers: {
						'X-CS-Confirmation-Cheat': this.apiConfig.sharedSecrets.confirmationCheat
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.joinCompanyResponse = response;
				callback();
			}
		)
	}

	loginToCompany (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/login',
				token: this.joinCompanyResponse ? this.joinCompanyResponse.accessToken : this.existingUserData.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.loginToCompanyResponse = response;
				callback();
			}
		)
	}
}

module.exports = CommonInit;
