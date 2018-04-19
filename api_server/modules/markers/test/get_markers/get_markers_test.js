'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const MarkerTestConstants = require('../marker_test_constants');

class GetMarkersTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.numPosts = 5;
	}

	get description () {
		return 'should return the correct markers when requesting markers for a stream';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create another user
			this.createRepo,		// create a repo as the orher user
			this.createStream,		// create a stream in the repo as the other user
			this.createPosts,		// create several posts in the stream
			this.setPath			// set the path to use for the request
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

	// create a random repo
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

	// create a single post in the stream
	createPost (n, callback) {
		let postOptions = this.setPostOptions(n);
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				// note the marker and its location
				let marker = response.markers[0];
				this.markers.push(marker);
				this.locations[marker._id] = response.markerLocations[0].locations[marker._id];
				callback();
			},
			postOptions
		);
	}

	// set post options for creating a post in the stream
	setPostOptions (n) {
		// we'll alternate who creates the post, unless we're not part of the stream
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

	// get the query parameters to use for the request
	getQueryParameters () {
		return {
			teamId: this.team._id,
			streamId: this.stream._id
		};
	}

	// set the path to use for the request
	setPath (callback) {
		let queryParameters = this.getQueryParameters();
		this.path = '/markers?' + Object.keys(queryParameters).map(parameter => {
			let value = queryParameters[parameter];
			return `${parameter}=${value}`;
		}).join('&');
		callback();
	}

	// validate correct response
	validateResponse (data) {
		// validate we got the correct markers, and that they are sanitized (free of attributes we don't want the client to see)
		this.validateMatchingObjects(data.markers, this.markers, 'markers');
		this.validateSanitizedObjects(data.markers, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetMarkersTest;
