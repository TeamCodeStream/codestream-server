'use strict';

const TeamLookupTest = require('./team_lookup_test');

class AddedCommitHashTest extends TeamLookupTest {

	get description() {
		return 'should match a repo on a commit hash added after the initial repo creation';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.postFactory.createRandomPost(
				(error, data) => {
					if (error) { return callback(error); }
					this.newCommitHash = data.markers[0].commitHashWhenCreated;
					this.makePath(callback);
				},
				{
					streamId: this.teamStream.id,
					wantCodemark: true,
					wantMarkers: 1,
					fileStreamId: this.repoStreams[0].id,
					token: this.users[1].accessToken
				}
			);
		});
	}
	getRequestData() {
		const data = super.getRequestData();
		if (this.firstTime) {
			return data;
		}
		return {
			commitHashes: this.newCommitHash
		};
	}
}

module.exports = AddedCommitHashTest;
