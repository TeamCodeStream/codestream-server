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

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRepo,
			this.createStream,
			this.createPosts,
			this.adjustMarkers,
			this.setData
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
				withEmails: [this.currentUser.email],
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
				teamId: this.team._id,
				repoId: this.repo._id,
				token: this.otherUserData.accessToken
			}
		);
	}

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

	createPost (n, callback) {
		let token = n % 2 === 1 ? this.token : this.otherUserData.accessToken;
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
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
				commitHash: this.commitHash
			}
		);
	}

	adjustMarkers (callback) {
		this.adjustedMarkerLocations = {};
		this.markers.sort((a, b) => { return a._id.localeCompare(b._id); });
		this.markers.forEach(marker => {
			this.adjustMarker(marker);
		});
		callback();
	}

	adjustMarker (marker) {
		let adjustedLocation = [];
		let location = this.locations[marker._id];
		location.slice(0, 4).forEach(coordinate => {
			let adjustedCoordinate = coordinate + Math.floor(Math.random() * coordinate);
			adjustedLocation.push(adjustedCoordinate);
		});
		this.adjustedMarkerLocations[marker._id] = adjustedLocation;
	}

	setData (callback) {
		this.newCommitHash = this.postFactory.randomCommitHash();
		this.data = {
			teamId: this.team._id,
			streamId: this.stream._id,
			commitHash: this.newCommitHash,
			locations: this.adjustedMarkerLocations
		};
		callback();
	}

	validateResponse (data) {
		Assert(Object.keys(data).length === 0, 'empty data set not returned');
	}
}

module.exports = PutMarkerLocationsTest;
