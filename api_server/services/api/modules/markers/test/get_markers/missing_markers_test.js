'use strict';

var GetMarkersTest = require('./get_markers_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');

class MissingMarkersTest extends GetMarkersTest {

	get description () {
		return 'should return markers with the correct locations, as well as markers with no location, when the marker locations for a given stream and commit is incomplete';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.adjustMarkers,
			this.saveMarkerLocationsForNewCommit,
			this.createMorePosts
		], callback);
	}

	adjustMarkers (callback) {
		this.adjustedMarkerLocations = {};
		this.markers.sort((a, b) => { return a._id.localeCompare(b._id); });
		this.markers.forEach(marker => {
			this.adjustMarker(marker);
		});
		this.originalMarkerIds = this.markers.map(marker => marker._id);
		callback();
	}

	adjustMarker (marker) {
		let adjustedLocation = [];
		marker.location.forEach(coordinate => {
			let adjustedCoordinate = coordinate + Math.floor(Math.random() * coordinate);
			adjustedLocation.push(adjustedCoordinate);
		});
		this.adjustedMarkerLocations[marker._id] = adjustedLocation;
	}

	saveMarkerLocationsForNewCommit (callback) {
		this.newCommitHash = this.postFactory.randomCommitHash();
		let data = {
			teamId: this.team._id,
			streamId: this.stream._id,
			commitHash: this.newCommitHash,
			locations: this.adjustedMarkerLocations
		};
		this.doApiRequest(
			{
				method: 'put',
				path: '/marker-locations',
				data: data,
				token: this.otherUserData.accessToken
			},
			callback
		);
	}

	createMorePosts (callback) {
		BoundAsync.timesSeries(
			this,
			3,
			this.createPost,
			callback
		);
	}

	setPostOptions (n) {
		let postOptions = super.setPostOptions(n);
		if (this.newCommitHash) {
			postOptions.commitHash = this.newCommitHash;
		}
		return postOptions;
	}

	validateResponse (data) {
		let receivedMarkers = data.markers;
		receivedMarkers.forEach(receivedMarker => {
			let marker = this.markers.find(marker => marker._id === receivedMarker._id);
			if (this.originalMarkerIds.indexOf(marker._id) >= 0) {
				Assert.deepEqual(marker.location, receivedMarker.location, 'location of received marker does not match');
			}
			else {
				Assert(!receivedMarker.location, 'marker should not have a location');
			}
		});
		super.validateResponse(data);
	}
}

module.exports = MissingMarkersTest;
