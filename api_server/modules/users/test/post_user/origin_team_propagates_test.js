'use strict';

const ExistingRegisteredUserTest = require('./existing_registered_user_test');
const Assert = require('assert');

class OriginTeamPropagatesTest extends ExistingRegisteredUserTest {

	constructor (options) {
		super(options);
		this.teamOptions.preCreateTeam = this.createOriginTeam;
	}

	get description () {
		return 'when inviting a user who is registered but not yet on a team, the invited user should inherit the origin team from the inviting user';
	}

	createOriginTeam (teamCreator, callback) {
		return callback(); // originTeam is no longer applicable in one-user-per-org
		const token = teamCreator.users[this.teamOptions.creatorIndex].accessToken;
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.originTeam = response.team;
				callback();
			},
			{
				token
			}
		);
	}

	validateResponse (data) {
		return; // originTeam is no longer applicable in one-user-per-org
		super.validateResponse(data);
	}
}

module.exports = OriginTeamPropagatesTest;
