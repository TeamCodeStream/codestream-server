'use strict';

const PostMarkerTest = require('./post_marker_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const TestTeamCreator = require(process.env.CS_API_TOP + '/lib/test_base/test_team_creator');

class StreamNoMatchTeamTest extends PostMarkerTest {

	get description () {
		return 'should return an error when trying to create a marker referencing a stream that doesn\'t match the given team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createOtherTeam,
			this.makeMarkerData
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
			userOptions: this.userOptions
		}).create((error, response) => {
			if (error) { return callback(error); }
			this.otherTeam = response.team;
			callback();
		});
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// substitute the ID of the second team
		super.makeMarkerData(() => {
			if (this.otherTeam) {
				this.data.teamId = this.otherTeam._id;
			}
			callback();
		});
	}
}

module.exports = StreamNoMatchTeamTest;
