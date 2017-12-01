'use strict';

var PutMarkerLocationsFetchTest = require('./put_marker_locations_fetch_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class AdditionalMarkerLocationsTest extends PutMarkerLocationsFetchTest {

	get description () {
		return 'should properly update marker locations when requested, when other marker locations already exist for the same stream and commit';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createMorePosts,
			this.adjustMoreMarkers,
			this.setMoreMarkerLocations
		], callback);
	}

	createMorePosts (callback) {
		this.newPostsIndex = this.posts.length;
		BoundAsync.timesSeries(
			this,
			3,
			this.createPost,
			callback
		);
	}

	adjustMoreMarkers (callback) {
		this.newMarkers = this.markers.slice(this.newPostsIndex);
		this.newMarkers.forEach(marker => {
			this.adjustMarker(marker);
		});
		callback();
	}

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
