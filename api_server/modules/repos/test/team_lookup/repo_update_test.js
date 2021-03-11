'use strict';

const TeamLookupTest = require('./team_lookup_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class RepoUpdateTest extends TeamLookupTest {

	get description() {
		return 'when a known commit hash is added to a repo, if that repo is on the auto-join list for a team, a team lookup for that team by the added commit hash should succeed';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.updateRepo,
			this.makePath
		], callback);
	}

	// add a new known commit hash to the test repo by posting a new codemark to it, using the commit hash
	updateRepo (callback) {
		this.useCommitHash = this.markerFactory.randomCommitHash();
		this.postFactory.createRandomPost(
			callback,
			{
				streamId: this.teamStream.id,
				wantCodemark: true,
				wantMarkers: 1,
				fileStreamId: this.repoStreams[0].id,
				commitHash: this.useCommitHash,
				token: this.users[1].accessToken
			}
		);
	}

	// get the data to be used for the test request
	getRequestData () {
		if (this.useCommitHash) {
			return { 
				commitHashes: [this.useCommitHash]
			};
		} else {
			return super.getRequestData();
		}
	}
}

module.exports = RepoUpdateTest;
