'use strict';

const ConfirmationTest = require('./confirmation_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class JoinOnConfirmTest extends ConfirmationTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		this.teamOptions.creatorIndex = 0;
		this.teamOptions.numAdditionalInvites = 0;
	}

	get description () {
		return 'when a registered user signs up and confirms, if a company to join is specified, the user automatically joins that company';
	}

	registerUser (callback) {
		// before registering the user, create a new company for them to be invited to
		BoundAsync.series(this, [
			this.createNewUser,
			this.createCompany,
			this.inviteUser,
			super.registerUser
		], callback);
	}

	createNewUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.createUserResponse = response;
				callback();
			},
			{
				confirmationCheat: this.apiConfig.sharedSecrets.confirmationCheat
			}
		);
	}
	
	createCompany (callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.createCompanyResponse = response;
				callback();
			},
			{ 
				token: this.createUserResponse.accessToken 
			}
		);
	}

	inviteUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.currentUser.user.email,
					teamId: this.createCompanyResponse.company.everyoneTeamId
				},
				token: this.createUserResponse.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.inviteUserResponse = response;
				callback();
			}
		);
	}

	getUserData () {
		const data = super.getUserData();
		data.email = this.currentUser.user.email;
		data.joinCompanyId = this.createCompanyResponse.company.id;
		data.originalEmail = data.email;
		return data;
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got the company, team, and repo in the response,
		// along with the expected streams
		Assert(data.companies.length === 1, 'no company in response');
		this.validateMatchingObject(this.createCompanyResponse.company.id, data.companies[0], 'company');
		Assert(data.teams.length === 1, 'no team in response');
		this.validateMatchingObject(this.createCompanyResponse.team.id, data.teams[0], 'team');
		Assert(data.streams.length === 1, 'expected 3 streams');
		const teamStream = data.streams.find(stream => stream.isTeamStream);
		this.validateMatchingObject(this.createCompanyResponse.streams[0].id, teamStream, 'team stream');
		this.userId = this.inviteUserResponse.user.id;
		super.validateResponse(data);
	}
}

module.exports = JoinOnConfirmTest;
