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
			this.createOtherUser,	// create another registered user
			this.createRepo,		// create a repo as the other user
			this.createStream,		// create a stream in the repo as the other user
			this.createPosts,		// create several posts in the stream as the other user
			this.setPath			// set the path to fetch marker locations
		], callback);
	}

	// create another registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a random repo, i'll be a member of the team that owns the repo or not, depending on the test
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withEmails: this.withoutMe ? null : [this.currentUser.email],	// include me or not, depending on the test
				token: this.otherUserData.accessToken	// the other user is the creator
			}
		);
	}

	// create a file stream in the repo
	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: 'file',
				token: this.otherUserData.accessToken,	// the other user is the creator
				teamId: this.repo.teamId,
				repoId: this.repo._id
			}
		);
	}

	// create several posts in the stream
	createPosts (callback) {
		this.markers = [];
		this.locations = {};
		this.commitHash = this.postFactory.randomCommitHash();	// they should all have the same commit hash
		BoundAsync.timesSeries(
			this,
			this.numPosts,
			this.createPost,
			callback
		);
	}

	// create a single post in the stream, making a note of the marker information
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

	// set post options for creating a post
	setPostOptions (n) {
		let iAmInStream = !this.withoutMe;	// if i'm not in the team, i can't create posts
		let mine = iAmInStream && n % 2 === 1;	// but if i am in the team, we'll make some of the posts come from me
		let postOptions = {
			token: mine ? this.token : this.otherUserData.accessToken,
			streamId: this.stream._id,
			wantCodeBlocks: 1,	// this gives us markers in the response
			commitHash: this.commitHash	// all posts have the same commit hash
		};
		return postOptions;
	}

	// these are the query parameters for the "GET /marker-locations" request
	getQueryParameters () {
		return {
			teamId: this.team._id,
			streamId: this.stream._id,
			commitHash: this.commitHash
		};
	}

	// set the path for the "GET /marker-locations" request
	setPath (callback) {
		let queryParameters = this.getQueryParameters();
		this.path = '/marker-locations?' + Object.keys(queryParameters).map(parameter => {
			let value = queryParameters[parameter];
			return `${parameter}=${value}`;
		}).join('&');
		callback();
	}

	// vdlidate we got the correct marker locations
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
