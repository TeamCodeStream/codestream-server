'use strict';

var AddedToTeamJoinMethodTest = require('./added_to_team_join_method_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class OriginTeamPropagatesForAddedUserTest extends AddedToTeamJoinMethodTest {

	get description () {
		return 'when a registered user is added to a team where the team was created by a user who created another team first, and this is the user\'s first team, the user\'s origin team should be the first team created, not the one they were added to';
	}

	// make the data needed before triggering the actual test,
    // we're overriding the base class here to insert the other user creating
    // another repo and team first
	makeData (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,		// create a second registered user
            this.createInitialRepo,     // create a repo (and team) before creating the test repo
			this.createRepo 			// create a repo (and team)
		], callback);
	}

    // create a repo before the repo we will use for the test,
    // this should end up creating the team that is the "origin team"
	createInitialRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.originTeam = response.team;
				callback();
			},
			{
				token: this.otherUserData.accessToken	// "other" user creates the repo
			}
		);
	}
}

module.exports = OriginTeamPropagatesForAddedUserTest;
