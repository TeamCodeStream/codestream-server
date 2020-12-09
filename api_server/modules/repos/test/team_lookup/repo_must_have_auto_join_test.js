'use strict';

const TeamLookupTest = require('./team_lookup_test');
const ObjectID = require('mongodb').ObjectID;

class RepoMustHaveAutoJoinTest extends TeamLookupTest {

	get description() {
		return 'should return an empty array when trying to lookup a team by repo and the repo does not have auto-join enabled for the team';
	}

	// override the default call to set team settings, override by setting auto-join for some random ID
	setTeamSettings(callback) {
		this.expectEmpty = true;
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
