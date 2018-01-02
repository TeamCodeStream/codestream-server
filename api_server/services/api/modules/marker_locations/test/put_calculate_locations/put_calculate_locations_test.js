'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class PutCalculateLocationsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.numPosts = 10;
		this.numEdits = 20;
		this.path = '/calculate-locations';
	}

	get description () {
		return 'should calculate marker locations when requested';
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
			this.createRandomEdits,	// create some random edits and throw them at the random markers
			this.setData			// set the data to be used in the request
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

	// create some random edits to throw at the random markers, this should be fun
	createRandomEdits (callback) {
		this.edits = this.markerFactory.randomEdits(this.numEdits);
		callback();
	}

	// set data to be used in the request
	setData (callback) {
		this.newCommitHash = this.postFactory.randomCommitHash();	// give the calculated marker locations a new commit
		this.data = {
			teamId: this.team._id,
			streamId: this.stream._id,
			originalCommitHash: this.commitHash,
			newCommitHash: this.newCommitHash,
			edits: this.edits
		};
		callback();
	}

	// validate we got back marker locations for each marker, but we're not validating
	// the actual location calculations here
	validateResponse (data) {
		Assert(typeof data.markerLocations === 'object', 'did not get markerLocations in response');
		const markerLocations = data.markerLocations;
		Assert.equal(markerLocations.teamId, this.team._id, 'incorrect teamId');
		Assert.equal(markerLocations.streamId, this.stream._id, 'incorrect streamId');
		Assert.equal(markerLocations.commitHash, this.newCommitHash.toLowerCase(), 'incorrect commitHash');
		Assert(typeof markerLocations.locations === 'object', 'did not get locations in response');
		let markerIds = Object.keys(markerLocations.locations);
		markerIds.sort();
		let myMarkerIds = Object.keys(this.locations);
		myMarkerIds.sort();
		Assert.deepEqual(myMarkerIds, markerIds, 'did not get expected markerIds in locations');
	}
}

module.exports = PutCalculateLocationsTest;
