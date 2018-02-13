// provide base class for most tests testing the "GET /teams/:id" request

'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const TeamTestConstants = require('../team_test_constants');

class GetTeamTest extends CodeStreamAPITest {

	getExpectedFields () {
		return { team: TeamTestConstants.EXPECTED_TEAM_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createRandomRepoByMe,	// have the current user create a repo (which creates a team)
			this.createOtherUser,		// create a second registered user
			this.createRandomRepo,		// have the other user create a repo and team
			this.setPath				// set the path to use when issuing the test request
		], callback);
	}

	// have the current user create a repo (which also creates a team)
	createRandomRepoByMe (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.myRepo = response.repo;
				this.myTeam = response.team;
				this.myUsers = response.users;
				callback();
			},
			{
				withRandomEmails: 2,	// add a couple unregistered users, for good measure
				token: this.token 		// current user's token
			}
		);
	}

	// create a second registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// have the "other" user create a repo and team, which may or may not include the "current" user
	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepo = response.repo;
				this.otherTeam = response.team;
				this.otherUsers = response.users;
				callback();
			},
			{
				withRandomEmails: 2,	// add a couple unregistered users for good measure
				withEmails: this.withoutMe ? null : [this.currentUser.email],	// add the current user or not as needed for the test
				token: this.otherUserData.accessToken	// the "other" user is the creator of the team
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// ensure the team we got back has no attributes the client shouldn't see, derived classes will do further validation
		this.validateSanitized(data.team, TeamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetTeamTest;
