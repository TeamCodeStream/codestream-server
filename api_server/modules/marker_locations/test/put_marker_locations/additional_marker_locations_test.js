'use strict';

var PutMarkerLocationsFetchTest = require('./put_marker_locations_fetch_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class AdditionalMarkerLocationsTest extends PutMarkerLocationsFetchTest {

	get description () {
		return 'should properly update marker locations when requested, when other marker locations already exist for the same stream and commit';
	}

	// before the test runs...
	before (callback) {
		// the idea is that we do the usual put from PutMarkerLocationsFetchTest to save marker locations,
		// then create some more markers, set their locations, and verify that all the marker locations are retrieved
		BoundAsync.series(this, [
			super.before,				// set up the initial set of marker locations
			this.createMorePosts,		// create some more posts with code blocks
			this.adjustMoreMarkers,		// adjust the location of the markers for a different commit
			this.setMoreMarkerLocations	// save those marker locations
		], callback);
	}

	// create more posts with code blocks that will give us more markers
	createMorePosts (callback) {
		this.newPostsIndex = this.posts.length;	// remember where the initial markers end and the new markers start
		BoundAsync.timesSeries(
			this,
			3,
			this.createPost,
			callback
		);
	}

	// adjust the new marker locations
	adjustMoreMarkers (callback) {
		this.newMarkers = this.markers.slice(this.newPostsIndex);
		this.newMarkers.forEach(marker => {
			this.adjustMarker(marker);	// base-class handles this
		});
		callback();
	}

	// save the marker locations we calculated for the new markers
	setMoreMarkerLocations (callback) {
		let newMarkerIds = this.newMarkers.map(marker => marker._id);
		let newAdjustedMarkerLocations = {};
		newMarkerIds.forEach(markerId => {
			newAdjustedMarkerLocations[markerId] = this.adjustedMarkerLocations[markerId];
		});
		let data = {
			teamId: this.team._id,
			streamId: this.stream._id,
			commitHash: this.newCommitHash,
			locations: newAdjustedMarkerLocations
		};
		this.doApiRequest(
			{
				method: 'put',
				path: '/marker-locations',
				data: data,
				token: this.token
			},
			callback
		);
	}
}

module.exports = AdditionalMarkerLocationsTest;
