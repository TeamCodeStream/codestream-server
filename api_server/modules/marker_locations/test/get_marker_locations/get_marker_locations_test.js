'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const MarkerLocationsTestConstants = require('../marker_locations_test_constants');

class GetMarkerLocationsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.type = 'channel';
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			numPosts: 5,
			creatorIndex: 1,
			wantCodemark: true,
			wantMarker: true,
			markerStreamId: 0,	// will use the existing file stream created for the repo
			commitHash: this.repoFactory.randomCommitHash()
		});
	}

	get description () {
		return 'should return the correct marker locations when requesting marker locations for a stream and commit';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath			// set the path to fetch marker locations
		], callback);
	}

	// these are the query parameters for the "GET /marker-locations" request
	getQueryParameters () {
		return {
			teamId: this.team.id,
			streamId: this.repoStreams[0].id,
			commitHash: this.postOptions.commitHash
		};
	}

	// set the path for the "GET /marker-locations" request
	setPath (callback) {
		this.markers = this.postData.map(postData => postData.markers[0]);
		this.locations = this.postData.reduce((locations, postData) => {
			const markerId = postData.markers[0].id;
			locations[markerId] = postData.markerLocations[0].locations[markerId];
			return locations;
		}, {});
		const queryParameters = this.getQueryParameters();
		this.path = '/marker-locations?' + Object.keys(queryParameters).map(parameter => {
			let value = queryParameters[parameter];
			return `${parameter}=${value}`;
		}).join('&');
		callback();
	}

	// vdlidate we got the correct marker locations
	validateResponse (data) {
		Assert(data.numMarkers === this.numPosts, 'number of markers indicated does not match the number of posts created');
		const markerLocations = data.markerLocations;
		Assert.equal(markerLocations.teamId, this.team.id, 'teamId does not match');
		Assert.equal(markerLocations.streamId, this.repoStreams[0].id, 'streamId does not match');
		Assert.equal(markerLocations.commitHash, this.postOptions.commitHash.toLowerCase(), 'commitHash does not match');
		const locations = markerLocations.locations;
		Assert.equal(Object.keys(locations).length, this.postOptions.numPosts, 'number of locations does not match the number of posts created');
		Object.keys(locations).forEach(markerId => {
			const marker = this.markers.find(marker => marker.id === markerId);
			Assert(marker, 'did not find a match for received marker location');
			Assert.deepEqual(locations[markerId], this.locations[markerId], 'location of received marker does not match that of the created marker');
		});
		this.validateSanitized(markerLocations, MarkerLocationsTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetMarkerLocationsTest;
