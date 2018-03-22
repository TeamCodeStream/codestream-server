'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var JoinMethodTest = require('./join_method_test');

class OriginTeamPropagates extends JoinMethodTest {

	get description () {
		return 'the user should inherit origin team ID from the team creator when confirming registration and already on a team';
	}

	// before the test runs...
	// overriding base class here to have the team creator create a different repo/team
	// before the test repo/team
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second registered user
			this.createOriginRepo,	// create another repo and team first, this should be the origin team
			this.createRepo,		// have that user create a repo, which creates a team, which the user for the test will already be on
			this.registerUser		// register the user, which basically gives us the confirmation code we will now use to confirm
		], callback);
	}

	// create another repo and team first, this should be the origin team
	createOriginRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.originTeam = response.team;
				callback();
			},
			{
				token: this.otherUserData.accessToken	// "other" user creates the repo and team
			}
		);
	}
}

module.exports = OriginTeamPropagates;
