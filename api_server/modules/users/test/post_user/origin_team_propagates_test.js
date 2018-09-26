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
		const token = teamCreator.users[this.teamOptions.creatorIndex].accessToken;
		this.teamFactory.createRandomTeam(
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
		Assert(this.originTeam, 'no origin team');
		super.validateResponse(data);
	}
}

module.exports = OriginTeamPropagatesTest;
