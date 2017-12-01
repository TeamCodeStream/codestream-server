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

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherRepo,
			super.before
		], callback);
	}

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

	getQueryParameters () {
		let queryParameters = super.getQueryParameters();
		queryParameters.teamId = this.otherRepo.teamId;
		return queryParameters;
	}
}

module.exports = StreamNoMatchTeamTest;
