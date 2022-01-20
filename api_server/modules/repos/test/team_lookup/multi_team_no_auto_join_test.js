'use strict';

const MultiTeamTest = require('./multi_team_test');
const ObjectId = require('mongodb').ObjectId;
const Assert = require('assert');

class MultiTeamNoAutoJoinTest extends MultiTeamTest {

	get description() {
		return 'when looking up teams by commit hash, even if the commit hash matches a repo owned by multiple teams, should only return info for teams that have auto-join for the repo turned on';
	}

	// override the default call to set team settings for the second team, override by setting auto-join for some random ID
	setSecondTeamSettings(callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/team-settings/${this.secondTeam.id}`,
				token: this.users[1].accessToken,
				data: {
					autoJoinRepos: [ObjectId()]
				}
			},
			callback
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.strictEqual(data.length, 1, 'should have returned only one entry');
		super.validateResponse(data, true);
	}
}

module.exports = MultiTeamNoAutoJoinTest;
