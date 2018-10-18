'use strict';

const PutMarkerLocationsTest = require('./put_marker_locations_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const TestTeamCreator = require(process.env.CS_API_TOP + '/lib/test_base/test_team_creator');

class OtherTeamTest extends PutMarkerLocationsTest {

	get description () {
		return 'should return error when attempting to put marker locations for a stream from a team not matching the given team ID';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createOtherTeam,
			this.createOtherStream
		], callback);
	}

	createOtherTeam (callback) {
		new TestTeamCreator({
			test: this,
			teamOptions: Object.assign({}, this.teamOptions, {
				creatorIndex: null,
				creatorToken: this.users[1].accessToken,
				members: [this.currentUser.user.email],
				numAdditionalInvites: 0
			}),
			userOptions: this.userOptions,
			repoOptions: {
				creatorToken: this.users[1].accessToken
			}
		}).create((error, response) => {
			if (error) { return callback(error); }
			this.otherTeam = response.team;
			this.otherRepo = response.repo;
			callback();
		});
	}

	// create another stream to try to put marker locations to
	createOtherStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.data.streamId = response.stream._id;
				callback();
			},
			{
				type: 'file',
				teamId: this.otherTeam._id,	// using the other team
				repoId: this.otherRepo._id,	// using the other repo
				token: this.users[1].accessToken	// other user is the creator
			}
		);
	}
}

module.exports = OtherTeamTest;
