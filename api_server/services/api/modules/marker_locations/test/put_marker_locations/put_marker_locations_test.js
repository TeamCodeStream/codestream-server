'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class PutMarkerLocationsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.numPosts = 5;
		this.path = '/marker-locations';
	}

	get description () {
		return 'should update marker locations when requested';
	}

	get method () {
		return 'put';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second user
			this.createRepo,		// create a repo as the other user
			this.createStream,		// create a stream as the other user
			this.createPosts,		// create some posts in the stream
			this.adjustMarkers,		// adjust the markers in the stream for a new commit
			this.setData			// set the data to be used int he request
		], callback);
	}

	// create another (registered) user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo (as the other user)
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withEmails: [this.currentUser.email],	// include the current user
				token: this.otherUserData.accessToken	// other user is the creator
			}
		);
	}

	// create a stream in the repo
	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: 'file',
				teamId: this.team._id,
				repoId: this.repo._id,
				token: this.otherUserData.accessToken // other user is the creator
			}
		);
	}

	// create some posts in the stream
	createPosts (callback) {
		this.posts = [];
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

	// create a single post in the stream (with code blocks, so we have markers)
	createPost (n, callback) {
		let token = n % 2 === 1 ? this.token : this.otherUserData.accessToken;	// we'll alternate who creates the posts
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				// store post, marker, and marker location info
				this.posts.push(response.post);
				let marker = response.markers[0];
				this.markers.push(marker);
				this.locations[marker._id] = response.markerLocations.locations[marker._id];
				callback();
			},
			{
				teamId: this.team._id,
				streamId: this.stream._id,
				wantCodeBlocks: 1,
				token: token,
				commitHash: this.commitHash	// they will all have the same commit hash
			}
		);
	}

	// generate some adjusted marker locations
	adjustMarkers (callback) {
		this.adjustedMarkerLocations = {};
		this.markers.sort((a, b) => { return a._id.localeCompare(b._id); });	// sort for easy compare to the results
		this.markers.forEach(marker => {
			this.adjustMarker(marker);
		});
		callback();
	}

	// adjust a single marker for saving as a different commit
	adjustMarker (marker) {
		let adjustedLocation = [];
		let location = this.locations[marker._id];
		// totally random adjustments, probably not realistic but it should do the trick
		location.slice(0, 4).forEach(coordinate => {
			let adjustedCoordinate = coordinate + Math.floor(Math.random() * coordinate);
			adjustedLocation.push(adjustedCoordinate);
		});
		this.adjustedMarkerLocations[marker._id] = adjustedLocation;
	}

	// set data to be used in the request
	setData (callback) {
		this.newCommitHash = this.postFactory.randomCommitHash();	// adjusted marker locations have a new commit
		this.data = {
			teamId: this.team._id,
			streamId: this.stream._id,
			commitHash: this.newCommitHash,
			locations: this.adjustedMarkerLocations
		};
		callback();
	}

	// validate empty object, we don't get any other data in the response
	validateResponse (data) {
		Assert(Object.keys(data).length === 0, 'empty data set not returned');
	}
}

module.exports = PutMarkerLocationsTest;
