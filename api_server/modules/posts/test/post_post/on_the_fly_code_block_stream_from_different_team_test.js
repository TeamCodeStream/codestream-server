'use strict';

const MarkerTest = require('./marker_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const TestTeamCreator = require(process.env.CS_API_TOP + '/lib/test_base/test_team_creator');

class OnTheFlyMarkerStreamFromDifferentTeamTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create a post with a marker for an on-the-fly stream where the stream is from a different team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'repo not owned by this team'
		};
	}

	// form the data we'll use in creating the post
	makePostData (callback) {
		// before forming the post data, we'll create a second repo and file-type
		// stream, we'll use this for the marker
		BoundAsync.series(this, [
			super.makePostData,
			this.createForeignTeam
		], callback);
	}

	createForeignTeam (callback) {
		new TestTeamCreator({
			test: this,
			teamOptions: Object.assign({}, this.teamOptions, {
				creatorIndex: null,
				creatorToken: this.users[1].accessToken,
				numAdditionalInvites: 0
			}),
			userOptions: this.userOptions,
			repoOptions: {
				creatorToken: this.users[1].accessToken
			}
		}).create((error, response) => {
			if (error) { return callback(error); }
			delete this.data.markers[0].streamId;
			Object.assign(this.data.markers[0], {
				repoId: response.repo._id,
				file: this.streamFactory.randomFile()
			});
			callback();
		});
	}
}

module.exports = OnTheFlyMarkerStreamFromDifferentTeamTest;
