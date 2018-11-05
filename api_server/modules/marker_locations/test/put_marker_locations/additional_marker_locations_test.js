'use strict';

const PutMarkerLocationsFetchTest = require('./put_marker_locations_fetch_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

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
			this.createMorePosts,		// create some more posts with markers
			this.adjustMoreMarkers,		// adjust the location of the markers for a different commit
			this.setMoreMarkerLocations	// save those marker locations
		], callback);
	}

	// create more posts with markers that will give us more markers
	createMorePosts (callback) {
		this.newPostsIndex = this.postData.length;	// remember where the initial markers end and the new markers start
		BoundAsync.timesSeries(
			this,
			3,
			this.createPost,
			callback
		);
	}

	// create a single post in the stream (with markers, so we have markers)
	createPost (n, callback) {
		let token = n % 2 === 1 ? this.token : this.users[1].accessToken;	// we'll alternate who creates the posts
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				// store post, marker, and marker location info
				this.postData.push(response);
				const marker = response.markers[0];
				this.markers.push(marker);
				this.locations[marker._id] = response.markerLocations[0].locations[marker._id];
				callback();
			},
			{
				teamId: this.team._id,
				streamId: this.stream._id,
				wantCodemark: 1,
				wantMarkers: 1,
				fileStreamId: this.repoStreams[0]._id,
				token: token,
				commitHash: this.postOptions.commitHash	// they will all have the same commit hash
			}
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
		const newMarkerIds = this.newMarkers.map(marker => marker._id);
		const newAdjustedMarkerLocations = {};
		newMarkerIds.forEach(markerId => {
			newAdjustedMarkerLocations[markerId] = this.adjustedMarkerLocations[markerId];
		});
		const data = {
			teamId: this.team._id,
			streamId: this.repoStreams[0]._id,
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
