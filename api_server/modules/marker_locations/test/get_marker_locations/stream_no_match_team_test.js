'use strict';

const GetMarkerLocationsTest = require('./get_marker_locations_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const TestTeamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/test_team_creator');

class StreamNoMatchTeamTest extends GetMarkerLocationsTest {

	get description () {
		return 'should return an error when trying to fetch marker locations from a stream where the team doesn\'t match';
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
			this.createOtherTeam,	// create a different team and put this in the path
			this.setPath
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

	// get query parameters to use for this test
	getQueryParameters () {
		const queryParameters = super.getQueryParameters();
		// set team ID to the other team
		if (this.otherTeam) {
			queryParameters.teamId = this.otherTeam.teamId;
		}
		return queryParameters;
	}
}

module.exports = StreamNoMatchTeamTest;
