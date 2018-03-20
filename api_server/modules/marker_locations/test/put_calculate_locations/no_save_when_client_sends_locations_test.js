'use strict';

var ClientSendsLocationsTest = require('./client_sends_locations_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');

class NoSaveWhenClientSendsLocationsTest extends ClientSendsLocationsTest {

	get description () {
		return `should properly calculate marker locations when requested, but when no ${this.omittedAttribute} is provided, should not save`;
	}

	get method () {
		return 'get';
	}

	// before the test runs..
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// create team/repo/stream/markers
			this.setMarkerLocations,	// calculate the marker locations (but this should NOT save to the server)
			this.setPath	// set the path, this is what we'll use to try to fetch the markers (and we shouldn't fetch anything)
		], callback);
	}

	// calculate marker locations for the markers by calling PUT /calculate-locations
	// the actual test is trying to read these marker locations and verifying we get nothing,
	// demonstrating that the server didn't save them
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
		// verify we got back an empty object for markerLocations
		Assert.deepEqual(data, { markerLocations: { } }, 'fetched non-empty object');
	}
}

module.exports = NoSaveWhenClientSendsLocationsTest;
