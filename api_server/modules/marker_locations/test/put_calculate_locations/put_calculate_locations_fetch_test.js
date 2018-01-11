'use strict';

var PutCalculateLocationsTest = require('./put_calculate_locations_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');

class PutCalculateLocationsFetchTest extends PutCalculateLocationsTest {

	get description () {
		return 'should properly calculate and save marker locations when requested, checked by fetching markers';
	}

	get method () {
		return 'get';
	}

	// before the test runs..
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// create team/repo/stream/markers
			this.setMarkerLocations,	// calculate the marker locations and save to the server
			this.setPath	// set the path, this is what we'll use to fetch the markers to verify they are correct
		], callback);
	}

	// calculate marker locations for the markers by calling PUT /calculate-locations
	// the actual test is reading these marker locations and verifying they are correct
	setMarkerLocations (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/calculate-locations',
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.outputMarkerLocations = response.markerLocations;
				callback();
			}
		);
	}

	// set path for the test request
	setPath (callback) {
		// the actual test is the fetch of the marker locations we just saved, and verifting they are correct
		this.path = `/marker-locations?teamId=${this.team._id}&streamId=${this.stream._id}&commitHash=${this.newCommitHash}`;
		delete this.data;	// don't need this anymore, data is in the query parameters
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.markerLocations, this.outputMarkerLocations, 'fetched marker locations do not match');
	}
}

module.exports = PutCalculateLocationsFetchTest;
