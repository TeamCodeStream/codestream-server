'use strict';

const RegistrationTest = require('./registration_test');
//const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class RepoBasedSignupDeprecatedTest extends RegistrationTest {

	constructor(options) {
		super(options);
		this.userOptions.numRegistered = 1;
		this.teamOptions.creatorIndex = 0;
		this.repoOptions.creatorIndex = 0;
	}

	get description() {
		return 'should return an error that functionality is deprecated when trying repo-based signup';
	}

	getExpectedError() {
		return {
			code: 'RAPI-1016',
			reason: 'repo-based signup is deprecated'
		};
	}

	// before the test runs...
	before(callback) {
		BoundAsync.series(this, [
			super.before,
			this.setTeamSettings,
			this.setRepoSignupData
		], callback);
	}

	// set the team settings to enable the auto-join feature
	setTeamSettings(callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/team-settings/${this.team.id}`,
				token: this.users[0].accessToken,
				data: {
					autoJoinRepos: [this.repo.id]
				}
			},
			callback
		);
	}

	// set the data to pass with the request indicating repo-based signup
	setRepoSignupData (callback) {
		this.data.teamId = this.team.id;
		this.data.repoId = this.repo.id;
		this.data.commitHash = this.repo.knownCommitHashes[0];
		callback();
	}

	/*
	// validate the response to the test request
	validateResponse(data) {
		Assert.deepStrictEqual(data.user.teamIds, [this.team.id], 'user created was not put on the team');
		Assert.deepStrictEqual(data.user.companyIds, [this.team.companyId], 'user created was not put in the company');
		super.validateResponse(data);
	}
	*/
}

module.exports = RepoBasedSignupDeprecatedTest;
