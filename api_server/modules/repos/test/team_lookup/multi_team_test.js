'use strict';

const TeamLookupTest = require('./team_lookup_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const TestTeamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/test_team_creator');
const Assert = require('assert');

class MultiTeamTest extends TeamLookupTest {

	get description() {
		return 'should return multiple records when looking for teams matching commit hashes from a repo owned by multiple teams';
	}

	before(callback) {
		BoundAsync.series(this, [
			super.before,
			this.createSecondTeam,
			this.setSecondTeamSettings
		], callback);
	}

	// create a second team to use for the test
	createSecondTeam(callback) {
		const testTeamCreator = new TestTeamCreator({
			test: this,
			userOptions: this.userOptions,
			teamOptions: Object.assign({}, this.teamOptions, {
				creatorToken: this.users[1].accessToken
			}),
			repoOptions: Object.assign({}, this.repoOptions, {
				creatorIndex: 0,
				withKnownCommitHashes: [this.repo.knownCommitHashes[2]]
			})
		});
		testTeamCreator.create((error, response) => {
			if (error) { return callback(error); }
			this.secondTeamCreator = response.users[0];
			this.secondTeam = response.team;
			this.secondRepo = response.repos[0];
			this.secondTeamToken = this.oneUserPerOrg ? testTeamCreator.teamOptions.creatorToken : this.users[1].accessToken
			callback();
		});
	}

	// set the team settings to enable the auto-join feature for the second team
	setSecondTeamSettings(callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/team-settings/${this.secondTeam.id}`,
				token: this.secondTeamToken,
				data: {
					autoJoinRepos: [this.secondRepo.id]
				}
			},
			callback
		);
	}

	// validate the response to the test request
	validateResponse(data, ignoreSecond=false) {
		if (!ignoreSecond) {
			data.sort((a, b) => {
				return a.repo.createdAt > b.repo.createdAt ? 1 : -1;
			});
			Assert.strictEqual(data[1].repo.id, this.secondRepo.id, 'returned repo should match the second repo');
			Assert.strictEqual(data[1].team.id, this.secondTeam.id, 'returned team should match the second team');
			const expectedAdminIds = this.oneUserPerOrg ? [this.secondTeam.adminIds[0]] : [this.users[1].user.id];
			Assert.deepStrictEqual(data[1].admins.map(a => a.id), expectedAdminIds, 'returned admins should match the team creator');
		}
		super.validateResponse(data);
	}
}

module.exports = MultiTeamTest;

