// provides the base class for all tests of the "GET /no-auth/invite-info" request

'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class InviteInfoTest extends CodeStreamAPITest {

	get description () {
		return 'should return correct info when requesting info relevant to an invite code';
	}

	get method () {
		return 'get';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.inviteUser
		], callback);
	}

	// invite a random user
	inviteUser (callback) {
		const data = this.getInviteUserData();
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.inviteCode = response.inviteCode;
				this.invitedUser = response.user;
				this.path = '/no-auth/invite-info?code=' + encodeURIComponent(this.inviteCode);
				callback();
			}
		);
	}

	// get the data to use in the invite user request
	getInviteUserData () {
		return {
			teamId: this.team.id,
			email: this.userFactory.randomEmail(),
			// indicates to send back invite code with the response, 
			// instead of just using it in an email
			_confirmationCheat: SecretsConfig.confirmationCheat	
		};
	}

	// validate the response to the test request
	validateResponse (data) {
		const expectedData = {
			email: this.invitedUser.email,
			teamId: this.team.id,
			teamName: this.team.name
		};
		Assert.deepEqual(data, expectedData, 'response data not correct');
	}
}

module.exports = InviteInfoTest;