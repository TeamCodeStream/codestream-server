// base class for many tests of the "GET /no-auth/team-lookup" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.setTeamSettings,
			this.makePath
		], callback);
	}

	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;

		// create some random known commit hashes to add to the test repo
		this.repoOptions.withKnownCommitHashes = [];
		for (let i = 0; i < 5; i++) {
			this.repoOptions.withKnownCommitHashes.push(this.markerFactory.randomCommitHash());
		}

		callback();
	}

	// make the path to be used during the test request
	makePath (callback) {
		const data = this.getRequestData();
		this.path = '/no-auth/team-lookup?' + Object.keys(data).map(key => {
			return `${key}=${encodeURIComponent(data[key])}`;
		}).join('&');
		this.modifiedAfter = Date.now();
		return callback();
	}

	// set the team settings to enable the auto-join feature
	setTeamSettings (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/team-settings/${this.team.id}`,
				token: this.users[1].accessToken,
				data: {
					autoJoinRepos: [this.repo.id]
				}
			},
			callback
		);
	}

	// get the data to be used for the test request
	getRequestData () {
		return {
			commitHashes: this.repo.knownCommitHashes[2]
		};
	}

	// perform the test request
	teamLookup (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: this.path,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.testResponse = response;
				this.requestData = this.data;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
