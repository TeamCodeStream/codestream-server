'use strict';

var GetMarkerLocationsTest = require('./get_marker_locations_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

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
			this.createOtherRepo,	// create another repo, which will create another team
			super.before	// try to run the usual test, which should fail
		], callback);
	}

	// create another repo, which will create another team
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

	// get query parameters for the request
	getQueryParameters () {
		// change the team ID in the request, this should cause a failure since the team ID must match
		// the team ID for the stream
		let queryParameters = super.getQueryParameters();
		queryParameters.teamId = this.otherRepo.teamId;
		return queryParameters;
	}
}

module.exports = StreamNoMatchTeamTest;
