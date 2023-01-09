'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RepoTestConstants = require('../repo_test_constants');
const TestTeamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/test_team_creator');

class GetReposTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		//this.streamOptions.creatorIndex = 0;
		Object.assign(this.postOptions, {
			creatorIndex: [0, 1, 1],
			numPosts: 3,
			wantCodemark: true,
			wantMarker: true
		});
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createForeignTeam,
			this.createForeignRepo,
			this.setPath
		], callback);
	}

	// create a "foreign" team, for which the current user is not a member
	createForeignTeam (callback) {
		new TestTeamCreator({
			test: this,
			teamOptions: Object.assign({}, this.teamOptions, {
				creatorToken: this.users[1].accessToken
			}),
			userOptions: this.userOptions
		}).create((error, response) => {
			if (error) { return callback(error); }
			this.foreignTeam = response.team;
			this.foreignTeamStream = response.teamStream;
			this.foreignTeamToken = response.users[1].accessToken;
			callback();
		});
	}
	
	// create a repo in the foreign team (by creating a post with a marker)
	createForeignRepo (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignRepo = response.repos[0];
				callback();
			},
			{
				token: this.foreignTeamToken,
				teamId: this.foreignTeam.id,
				streamId: this.foreignTeamStream.id,
				wantCodemark: true,
				wantMarkers: 1,
				withRandomStream: true
			}
		);
	}
	
	// validate the response to the test request
	validateResponse (data) {
		// validate we got all the expected repos, and that no attributes were returned not suitable for clients
		this.validateMatchingObjects(this.expectedRepos, data.repos, 'repos');
		this.validateSanitizedObjects(data.repos, RepoTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetReposTest;
