'use strict';

const LoginTest = require('./login_test');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');

class InitialDataTest extends LoginTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.teamOptions.numAdditionalInvites = 2;
		this.streamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
	}

	get description () {
		return 'user should receive teams and repos with response to a raw login';
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
		// verify we got the team and repo that were created
		Assert(data.teams.length === 1, 'no team in response');
		this.validateMatchingObject(this.team._id, data.teams[0], 'team');
		Assert(data.repos.length === 1, 'no repo in response');
		this.validateMatchingObject(this.repo._id, data.repos[0], 'repo');
		super.validateResponse(data);
	}
}

module.exports = InitialDataTest;
