'use strict';

const LoginTest = require('./login_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');

class InitialDataTest extends LoginTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.teamOptions.numAdditionalInvites = 2;
		this.streamOptions.creatorIndex = 1;
		this.postOptions.creatorIndex = 1;
		this.postOptions.wantCodeBlock = true;
	}

	get description () {
		return 'user should receive teams and repos with response to login';
	}

	getExpectedFields () {
		// with the login request, we should get back a user object with attributes
		// only the user should see
		let response = Object.assign({}, super.getExpectedFields());
		response.user = [...response.user, ...UserTestConstants.EXPECTED_ME_FIELDS];
		return response;
	}

	before (callback) {
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			super.before
		], callback);
	}
	
	getUserData () {
		const data = this.userFactory.getRandomUserData();
		data.email = this.users[3].user.email;
		return data;
	}
			
	// validate the response to the test request
	validateResponse (data) {
		// verify we got the team and repo that were created
		Assert(data.teams.length === 1, 'no team in response');
		this.validateMatchingObject(this.team._id, data.teams[0], 'team');
		Assert(data.repos.length === 1, 'no repo in response');
		this.validateMatchingObject(this.postData[0].repos[0]._id, data.repos[0], 'repo');
		super.validateResponse(data);
	}
}

module.exports = InitialDataTest;
