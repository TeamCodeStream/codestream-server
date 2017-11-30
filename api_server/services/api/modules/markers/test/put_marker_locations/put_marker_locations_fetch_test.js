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
		this.path = `/markers?teamId=${this.team._id}&streamId=${this.stream._id}&commitHash=${this.newCommitHash}`;
		delete this.data;
		callback();
	}

	validateResponse (data) {
		let markers = data.markers;
		Assert(markers.length === this.markers.length, 'did not receive all markers');
		markers.sort((a, b) => { return a._id.localeCompare(b._id); });
		this.markers.sort((a, b) => { return a._id.localeCompare(b._id); });
		for (var i = 0, length = markers.length; i < length; i++) {
			this.validateMarker(i, markers[i]);
		}
	}

	validateMarker (n, marker) {
		let myMarker = this.markers[n];
		Assert(myMarker._id === marker._id, '_id of returned marker does not match');
		Assert.deepEqual(this.adjustedMarkerLocations[marker._id], marker.location, 'location of returned marker does not match');
	}
}

module.exports = PutMarkerLocationsFetchTest;
