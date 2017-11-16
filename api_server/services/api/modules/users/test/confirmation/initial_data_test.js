'use strict';

var ConfirmationTest = require('./confirmation_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');

class InitialDataTest extends ConfirmationTest {

	get description () {
		return 'user should receive teams and repos with response to email confirmation';
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRepo,
			this.registerUser
		], callback);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.otherUserData = response;
				callback();
			}
		);
	}

	createRepo (callback) {
		this.email = this.userFactory.randomEmail();
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				withEmails: [this.email],
				token: this.otherUserData.accessToken
			}
		);
	}

	registerUser (callback) {
		let data = this.userFactory.getRandomUserData();
		Object.assign(data, {
			email: this.email,
			_confirmationCheat: SecretsConfig.confirmationCheat,	// gives us the confirmation code in the response
			_forceConfirmation: true	// overrides developer environment, where confirmation might be turned off
		});
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data = {
					userId: response.user._id,
					email: this.email,
					confirmationCode: response.user.confirmationCode
				};
				callback();
			}
		);
	}

	validateResponse (data) {
		Assert(data.teams.length === 1, 'no team in response');
		this.validateMatchingObject(this.team._id, data.teams[0], 'team');
		Assert(data.repos.length === 1, 'no repo in response');
		this.validateMatchingObject(this.repo._id, data.repos[0], 'repo');
		super.validateResponse(data);
	}
}

module.exports = InitialDataTest;
