'use strict';

const TeamLookupTest = require('./team_lookup_test');
const ObjectID = require('mongodb').ObjectID;

class RepoMustHaveAutoJoinTest extends TeamLookupTest {

	get description() {
		return `should return an error when trying to lookup a team by repo and the repo does not have auto-join enabled for the team`;
	}

	getExpectedError() {
		return {
			code: 'RAPI-1009',
			reason: 'Auto-join is not enabled for this repo and team'
		};
	}

	// override the default call to set team settings, override by doing nothing
	setTeamSettings(callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/team-settings/${this.team.id}`,
				token: this.users[1].accessToken,
				data: {
					autoJoinRepos: [ObjectID()]
				}
			},
			callback
		);
	}
}

module.exports = RepoMustHaveAutoJoinTest;
