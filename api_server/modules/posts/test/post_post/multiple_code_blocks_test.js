'use strict';

var Assert = require('assert');
var PostCodeToFileStreamTest = require('./post_code_to_file_stream_test');
const PostTestConstants = require('../post_test_constants');

class MultipleMarkersTest extends PostCodeToFileStreamTest {

	constructor (options) {
		super(options);
		this.numMarkers = 3;
	}

	get description () {
		return 'should see all the markers when a post is created in the stream with multiple markers';
	}

	// form options to use when creating the data for the post we'll create
	makePostOptions (callback) {
		// say we want several markers when creating the post
		super.makePostOptions(() => {
			this.postOptions.wantMarkers = this.numMarkers;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		let post = data.post;
		// validate that we got markers for each marker
		Assert(data.markers instanceof Array, 'no markers array');
		Assert(data.markers.length === this.numMarkers, 'length of markers array is not equal to the number of markers');
		for (let i = 0; i < this.numMarkers; i++) {
			let marker = data.markers[i];
			Assert(marker.teamId === post.teamId, 'teamId does not match');
			Assert(marker.streamId === post.streamId, 'streamId does not match');
			Assert(marker.postId === post._id, 'postId does not match');
			Assert(marker.deactivated === false, 'deactivated is not false');
			Assert(marker.numComments === 1, 'marker should have 1 comment');
			Assert(marker.commitHashWhenCreated === this.data.commitHashWhenPosted.toLowerCase(), 'commitHashWhenCreated does not match');
			Assert(marker._id === post.markers[i].markerId, 'markerId in marker does not match marker created');
			this.validateSanitized(marker, PostTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
		}
		this.validateMarkerLocations(data, post);
		this.validateMultipleMarkerStreamUpdate(data);
		super.validateResponse(data);
	}

	// validate the marker locations structure we got back in the response to the test request
	validateMarkerLocations (data, post) {
		// validate we got the expected marker locations, according to the markers we sent
		// in the request to create a post
		Assert(typeof data.markerLocations[0] === 'object', 'missing or invalid markerLocations object');
		let markerLocations = data.markerLocations[0];
		Assert(markerLocations.teamId === post.teamId, 'markerLocations teamId does not match');
		Assert(markerLocations.streamId === post.streamId, 'markerLocations streamId does not match');
		Assert(markerLocations.commitHash === post.commitHashWhenPosted, 'markerLocations commitHash does not match commit hash for post');
		Assert(typeof markerLocations.locations === 'object', 'missing or invalid locations object in markerLocations object');
		let locations = markerLocations.locations;
		for (let i = 0; i < this.numMarkers; i++) {
			let marker = data.markers[i];
			Assert.deepEqual(locations[marker._id], this.data.markers[i].location, 'location for marker does not match');
		}
	}

	// validate that there was a stream update which increments the number of markers by the number of markers
	validateMultipleMarkerStreamUpdate (data) {
		const streamUpdate = data.streams.find(stream => stream._id === this.stream._id);
		Assert.equal(streamUpdate.$inc.numMarkers, this.numMarkers, 'numMarkers not incremented by number of markers for stream update');
	}
}

module.exports = MultipleMarkersTest;
