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
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			wantCodeError: true
		});
	}

	get description () {
		return `user should receive teams and repos with response to email confirmation, in one-user-per-org paradigm`;
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
		// under one-user-per-org, you confirm a teamless user, and only become part of teams you have
		// been invited to by accepting the invite ... so we should see NO team data in the initial data
		Assert(data.companies.length === 0, 'found companies in one-user-per-org response');
		Assert(data.teams.length === 0, 'found teams in one-user-per-org response');
		Assert(!data.repos || data.repos.length === 0, 'found repos in one-user-per-org response');
		Assert(!data.streams, 'found streams in one-user-per-org response');
		if (!this.usingNRLogins) {
			Assert(data.user.eligibleJoinCompanies.length > 0, 'did not get an eligible join company in one-user-per-org response');
		}
		super.validateResponse(data);
	}
}

module.exports = InitialDataTest;
