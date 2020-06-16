'use strict';

const ProviderConnectTest = require('./provider_connect_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class TeamMismatchTest extends ProviderConnectTest {

	constructor (options) {
		super(options);
		this.wantPreExistingTeam = true;
	}

	get description () {
		return `should return error when connecting to ${this.provider} with a team ID but the team ID doesn't match the team tied to ${this.provider}`;
	}

	getExpectedError () {
		return {
			code: 'USRC-1016'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createOtherUser,
			this.createOtherTeam
		], callback);
	}

	// create a registered user to create the other team
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a secondary team, we'll use this for the invite instead of the team
	// the user should be connected to
	createOtherTeam (callback) {
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.data.teamId = response.team.id;
				callback();
			},
			{ 
				token: this.otherUserData.accessToken
			}
		);
	}
}

module.exports = TeamMismatchTest;
