'use strict';

var GetMarkersTest = require('./get_markers_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class StreamNoMatchTeamTest extends GetMarkersTest {

	get description () {
		return 'should return an error when trying to fetch markers from a stream where the team doesn\'t match';
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
			this.createOtherRepo,	// create a different repo
			super.before	// set up the GET /markers test
		], callback);
	}

	// create a different repo (and team)
	createOtherRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepo = response.repo;
				callback();
			},
			{
				token: this.token
			}
		);
	}

	// get query parameters to use for this test
	getQueryParameters () {
		let queryParameters = super.getQueryParameters();
		// set team ID to the team of the other repo
		queryParameters.teamId = this.otherRepo.teamId;
		return queryParameters;
	}
}

module.exports = StreamNoMatchTeamTest;
