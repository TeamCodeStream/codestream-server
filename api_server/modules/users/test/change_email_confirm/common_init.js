// base class for many tests of the "PUT /change-email-confirm" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.createTeam,	// user creates a team to be on
			this.changeEmail,	// issue the change-email request to get the token
			this.setData		// set the data to use when confirming
		], callback);
	}
	
	// current user creates a team for them to be on
	createTeam (callback) {
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			},
			{
				token: this.token
			}
		);
	}

	// issue the change-email test to get the token
	changeEmail (callback) {
		this.newEmail = this.userFactory.randomEmail();
		const data = {
			email: this.newEmail,
			expiresIn: this.expiresIn,
			_confirmationCheat: SecretsConfig.confirmationCheat,	// gives us the token in the response
		};

		// issue a forgot-password request, with a secret to allow use to receive the token
		// in the response, rather than having to go through email
		this.doApiRequest(
			{
				method: 'put',
				path: '/change-email',
				data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.emailToken = response.confirmationToken;
				callback();
			}
		);
	}
    
	// set the data to use when confirming 
	setData (callback) {
		this.data = { 
			token: this.emailToken
		};
		callback();
	}
}

module.exports = CommonInit;
