'use strict';

const UserAlreadyConnectedOnTeamTest = require('./user_already_connected_on_team_test');
const Assert = require('assert');

class TokenReplacementTest extends UserAlreadyConnectedOnTeamTest {

	get description () {
		return `when connecting to ${this.provider} as pre-existing user already on a team, but with a new token, the stored token should be replaced`;
	}

	setData (callback) {
		super.setData(() => {
			// change the mock auth-token in a way that doesn't affect the info that
			// needs to be extracted from it
			const tokenPart = this.data.providerInfo.authToken.slice(5);
			this.newAuthToken = `mockx-${tokenPart}`;
			this.data.providerInfo.authToken = this.newAuthToken;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// ensure we got the new auth token back in the response
		Assert.equal(data.user.providerInfo[this.provider].authToken, this.newAuthToken,
			'returned auth token does not match the changed auth token');
		super.validateResponse(data);
	} 
}

module.exports = TokenReplacementTest;
