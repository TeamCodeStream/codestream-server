'use strict';

const LoginByCodeTest = require('./login_by_code_test');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');
const GetStandardProviderHosts = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/providers/provider_test_constants');

class InitialDataTest extends LoginByCodeTest {

	constructor (options) {
		super(options);
		this.firstSessionShouldBeUndefined = this.oneUserPerOrg;
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
		const oneUserPerOrg = this.oneUserPerOrg ? ', under one-user-per-org paradigm' : ''; // ONE_USER_PER_ORG
		return `user should receive teams and repos with response to logging in by code${oneUserPerOrg}`;
	}

	getExpectedFields () {
		// with the login request, we should get back a user object with attributes
		// only the user should see
		let response = Object.assign({}, super.getExpectedFields());
		response.user = [...response.user, ...UserTestConstants.EXPECTED_ME_FIELDS];
		return response;
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert(data.companies.length === 1, 'no company in response');
		this.validateMatchingObject(this.company.id, data.companies[0], 'company');
		Assert(data.teams.length === 1, 'no team in response');
		this.validateMatchingObject(this.team.id, data.teams[0], 'team');
		Assert(data.repos.length === 1, 'no repo in response');
		this.validateMatchingObject(this.repo.id, data.repos[0], 'repo');
		Assert(data.streams.length === 3, 'expected 3 streams');
		const teamStream = data.streams.find(stream => stream.isTeamStream);
		const fileStream = data.streams.find(stream => stream.type === 'file');
		const repoStream = this.repoStreams.find(stream => stream.type === 'file');
		const objectStream = data.streams.find(stream => stream.type === 'object');
		this.validateMatchingObject(this.teamStream.id, teamStream, 'team stream');
		this.validateMatchingObject(repoStream.id, fileStream, 'file stream');
		this.validateMatchingObject(this.postData[0].codeError.streamId, objectStream, 'object stream');
		const providerHosts = GetStandardProviderHosts(this.apiConfig);
		Assert.deepEqual(data.teams[0].providerHosts, providerHosts, 'returned provider hosts is not correct');
		super.validateResponse(data);
	}
}

module.exports = InitialDataTest;
