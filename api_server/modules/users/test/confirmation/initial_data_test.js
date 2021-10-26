'use strict';

const ConfirmationTest = require('./confirmation_test');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');
const GetStandardProviderHosts = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/providers/provider_test_constants');

class InitialDataTest extends ConfirmationTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			numAdditionalInvites: 2
		});
		this.teamOptions.numAdditionalInvites = 2;
		//this.streamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
	}

	get description () {
		return 'user should receive teams and repos with response to email confirmation';
	}

	getExpectedFields () {
		// with the login request, we should get back a user object with attributes
		// only the user should see
		let response = Object.assign({}, super.getExpectedFields());
		response.user = [...response.user, ...UserTestConstants.EXPECTED_ME_FIELDS];
		return response;
	}

	getUserData () {
		const data = this.userFactory.getRandomUserData();
		data.email = this.users[3].user.email;
		return data;
	}
			
	// validate the response to the test request
	validateResponse (data) {
		// validate that we got the company, team, and repo in the response
		Assert(data.companies.length === 1, 'no company in response');
		this.validateMatchingObject(this.company.id, data.companies[0], 'company');
		Assert(data.teams.length === 1, 'no team in response');
		this.validateMatchingObject(this.team.id, data.teams[0], 'team');
		Assert(data.repos.length === 1, 'no repo in response');
		this.validateMatchingObject(this.repo.id, data.repos[0], 'repo');
		const providerHosts = GetStandardProviderHosts(this.apiConfig);
		Assert.deepEqual(data.teams[0].providerHosts, providerHosts, 'returned provider hosts is not correct');
		super.validateResponse(data);
	}
}

module.exports = InitialDataTest;
