'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
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
			numPosts: 10,
			creatorIndex: 1,
			wantCodemark: true,
			wantMarker: true,
			markerStreamId: 0,	// will use the existing file stream created for the repo
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
			this.setMarkers,
			this.setPath
		], callback);
	}

	// set the markers established for the test
	setMarkers (callback) {
		this.markers = this.postData.map(postData => postData.markers[0]);
		this.locations = this.postData.reduce((locations, postData) => {
			const markerId = postData.markers[0].id;
			locations[markerId] = postData.markerLocations[0].locations[markerId];
			return locations;
		}, {});
		this.markers.push(this.repoMarker);
		callback();
	}

	// get query parameters to use in the test query
	getQueryParameters () {
		return {
			teamId: this.team.id,
			streamId: this.repoStreams[0].id
		};
	}

	// set the path to use for the request
	setPath (callback) {
		this.expectedMarkers = this.markers;
		const queryParameters = this.getQueryParameters();
		this.path = '/markers?' + Object.keys(queryParameters).map(parameter => {
			return `${parameter}=${queryParameters[parameter]}`;
		}).join('&');
		callback();
	}

	// validate correct response
	validateResponse (data) {
		// validate we got the correct markers, and that they are sanitized (free of attributes we don't want the client to see)
		this.validateMatchingObjects(data.markers, this.expectedMarkers, 'markers');
		this.validateSanitizedObjects(data.markers, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);

		// make sure that for each marker, we also got a post and an codemark that reference the marker
		data.markers.forEach(marker => {
			const codemark = data.codemarks.find(codemark => codemark.id === marker.codemarkId);
			Assert(codemark, 'no codemark found for marker');
			if (!marker.providerType) {
				const post = data.posts.find(post => post.id === codemark.postId);
				Assert(post, 'no post found for marker\'s codemark');
			}
		});
	}
}

module.exports = GetMarkersTest;
