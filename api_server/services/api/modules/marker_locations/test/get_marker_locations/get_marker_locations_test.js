'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
const MarkerLocationsTestConstants = require('../marker_locations_test_constants');

class GetMarkerLocationsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.numPosts = 5;
	}

	get description () {
		return 'should return the correct marker locations when requesting marker locations for a stream and commit';
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRepo,
			this.createStream,
			this.createPosts,
			this.setPath
		], callback);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withEmails: this.withoutMe ? null : [this.currentUser.email],
				token: this.otherUserData.accessToken
			}
		);
	}

	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: 'file',
				token: this.otherUserData.accessToken,
				teamId: this.repo.teamId,
				repoId: this.repo._id
			}
		);
	}

	createPosts (callback) {
		this.markers = [];
		this.locations = {};
		this.commitHash = this.postFactory.randomCommitHash();
		BoundAsync.timesSeries(
			this,
			this.numPosts,
			this.createPost,
			callback
		);
	}

	createPost (n, callback) {
		let postOptions = this.setPostOptions(n);
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				let marker = response.markers[0];
				this.markers.push(marker);
				this.locations[marker._id] = response.markerLocations.locations[marker._id];
				callback();
			},
			postOptions
		);
	}

	setPostOptions (n) {
		let iAmInStream = !this.withoutMe;
		let mine = iAmInStream && n % 2 === 1;
		let postOptions = {
			token: mine ? this.token : this.otherUserData.accessToken,
			streamId: this.stream._id,
			wantCodeBlocks: 1,
			commitHash: this.commitHash
		};
		return postOptions;
	}

	getQueryParameters () {
		return {
			teamId: this.team._id,
			streamId: this.stream._id,
			commitHash: this.commitHash
		};
	}

	setPath (callback) {
		let queryParameters = this.getQueryParameters();
		this.path = '/marker-locations?' + Object.keys(queryParameters).map(parameter => {
			let value = queryParameters[parameter];
			return `${parameter}=${value}`;
		}).join('&');
		callback();
	}

	validateResponse (data) {
		Assert(data.numMarkers === this.numPosts, 'number of markers indicated does not match the number of posts created');
		let markerLocations = data.markerLocations;
		Assert(markerLocations.teamId === this.team._id, 'teamId does not match');
		Assert(markerLocations.streamId === this.stream._id, 'teamId does not match');
		Assert(markerLocations.commitHash === this.commitHash.toLowerCase(), 'commitHash does not match');
		let locations = markerLocations.locations;
		Assert(Object.keys(locations).length === this.numPosts, 'number of locations does not match the number of posts created');
		Object.keys(locations).forEach(markerId => {
			let marker = this.markers.find(marker => marker._id === markerId);
			Assert(marker, 'did not find a match for received marker location');
			Assert.deepEqual(locations[markerId], this.locations[markerId], 'location of received marker does not match that of the created marker');
		});
		this.validateSanitized(markerLocations, MarkerLocationsTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetMarkerLocationsTest;
