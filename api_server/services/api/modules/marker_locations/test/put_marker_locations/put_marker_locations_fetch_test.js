'use strict';

var PutMarkerLocationsTest = require('./put_marker_locations_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');

class PutMarkerLocationsFetchTest extends PutMarkerLocationsTest {

	get description () {
		return 'should properly update marker locations when requested, checked by fetching markers';
	}

	get method () {
		return 'get';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setMarkerLocations,
			this.setPath
		], callback);
	}

	setMarkerLocations (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/marker-locations',
				data: this.data,
				token: this.token
			},
			callback
		);
	}

	setPath (callback) {
		this.path = `/marker-locations?teamId=${this.team._id}&streamId=${this.stream._id}&commitHash=${this.newCommitHash}`;
		delete this.data;
		callback();
	}

	validateResponse (data) {
		let markerLocations = data.markerLocations;
		let locations = markerLocations.locations;
		Assert(Object.keys(locations).length === this.markers.length, 'did not receive marker locations for all markers');
		Object.keys(locations).forEach(markerId => {
			this.validateMarker(markerId, locations[markerId]);
		});
	}

	validateMarker (markerId, location) {
		let marker = this.markers.find(marker => marker._id === markerId);
		Assert(marker, 'got markerId that does not correspond to a marker created by this request');
		Assert.deepEqual(this.adjustedMarkerLocations[marker._id], location, 'returned location does not match');
	}
}

module.exports = PutMarkerLocationsFetchTest;
