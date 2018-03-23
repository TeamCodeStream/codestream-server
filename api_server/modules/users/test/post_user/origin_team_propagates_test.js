'use strict';

const ExistingRegisteredUserTest = require('./existing_registered_user_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class OriginTeamPropagatesTest extends ExistingRegisteredUserTest {

	get description () {
		return 'when inviting a user who is registered but not yet on a team, the invited user should inherit the origin team from the inviting user';
	}

	// create a repo and team for the test user to be invited onto
	createRandomRepo (callback) {
		// we'll create another team/repo before the one used for the test ...
		// the origin team of the invited user should be the same as the first team
		// created, not the one the user was invited to
		BoundAsync.series(this, [
			this.createOriginRepo,
			super.createRandomRepo
		], callback);
	}

	// create a repo and team, before the one that the user will be invited to,
	// this should become the origin team for the invited user
	createOriginRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.originTeam = response.team;
				callback();
			},
			{
				token: this.teamCreatorData.accessToken	// the "team creator" creates the repo and team
			}
		);
	}
}

module.exports = OriginTeamPropagatesTest;
