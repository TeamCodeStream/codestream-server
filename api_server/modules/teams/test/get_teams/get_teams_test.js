'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const TeamTestConstants = require('../team_test_constants');
const TestTeamCreator = require(process.env.CS_API_TOP + '/lib/test_base/test_team_creator');

class GetTeamsTest extends CodeStreamAPITest {

	get description () {
		return 'should return teams i am a member of when requesting my teams';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createTeamWithMe,
			this.createTeamWithoutMe,
			this.setPath					
		], callback);
	}

	createTeamWithMe (callback) {
		new TestTeamCreator({
			test: this,
			teamOptions: {
				creatorToken: this.users[1].accessToken,
				members: [this.users[0].user.email]
			},
			userOptions: this.userOptions
		}).create((error, data) => {
			if (error) { return callback(error); }
			this.teamWithMe = data.team;
			callback();
		});
	}

	createTeamWithoutMe (callback) {
		new TestTeamCreator({
			test: this,
			teamOptions: {
				creatorToken: this.users[1].accessToken
			},
			userOptions: this.userOptions
		}).create((error, data) => {
			if (error) { return callback(error); }
			this.teamWithoutMe = data.team;
			callback();
		});
	}

	// set the path for the test
	setPath (callback) {
		this.path = '/teams?mine';
		callback();
	}

	// validate we got only teams i am in, meaning the team i created,
	// and the other teams that were created with me as part of the team
	validateResponse (data) {
		let myTeams = [this.team, this.teamWithMe];
		this.validateMatchingObjects(myTeams, data.teams, 'teams');
		this.validateSanitizedObjects(data.teams, TeamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetTeamsTest;
