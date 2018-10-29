'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const MarkerTestConstants = require('../marker_test_constants');
const Assert = require('assert');

class GetMarkersTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.type = 'channel';
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			numPosts: 5,
			creatorIndex: 1,
			wantCodeBlock: true,
			codeBlockStreamId: 0,	// will use the existing file stream created for the repo
			commitHash: this.repoFactory.randomCommitHash()
		});
	}

	get description () {
		return 'should return the correct markers when requesting markers for a stream';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath			// set the path to use for the request
		], callback);
	}

	// get the query parameters to use for the request
	getQueryParameters () {
		this.markers = this.postData.map(postData => postData.markers[0]);
		this.locations = this.postData.reduce((locations, postData) => {
			const markerId = postData.markers[0]._id;
			locations[markerId] = postData.markerLocations[0].locations[markerId];
			return locations;
		}, {});
		this.markers.push(this.repoMarker);
		return {
			teamId: this.team._id,
			streamId: this.repoStreams[0]._id
		};
	}

	// set the path to use for the request
	setPath (callback) {
		const queryParameters = this.getQueryParameters();
		this.path = '/markers?' + Object.keys(queryParameters).map(parameter => {
			const value = queryParameters[parameter];
			return `${parameter}=${value}`;
		}).join('&');
		callback();
	}

	// validate correct response
	validateResponse (data) {
		// validate we got the correct markers, and that they are sanitized (free of attributes we don't want the client to see)
		this.validateMatchingObjects(data.markers, this.markers, 'markers');
		this.validateSanitizedObjects(data.markers, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);

		// make sure we got a post with each marker that matches the post that references the marker
		data.markers.forEach(marker => {
			if (marker.post) {
				Assert.equal(marker.post._id, marker.postId, 'ID of child post to marker does not match the marker\'s postId');
			}
			else {
				Assert(marker.providerType, 'no post for a non-third-party marker');
			}
		});
	}
}

module.exports = GetMarkersTest;
