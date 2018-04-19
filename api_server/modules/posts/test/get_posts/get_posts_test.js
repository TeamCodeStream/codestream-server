'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const PostTestConstants = require('../post_test_constants');

class GetPostsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.type = this.type || 'channel';
		this.numPosts = 5;
	}

	get description () {
		return `should return the correct posts when requesting posts in a ${this.type} stream`;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second user
			this.createRandomRepo,	// create a repo
			this.createStream,		// create a stream in that repo
			this.createPosts,		// create a series of posts in that stream
			this.setPath			// set the path for our request to retrieve posts
		], callback);
	}

	// create a second register user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a random repo (which will also create a team)
	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withRandomEmails: 2,	// throw in a couple other users
				withEmails: this.withoutMeOnTeam ? null : [this.currentUser.email], // with me or without me, as needed for the test
				token: this.otherUserData.accessToken // the other user will be the creator
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
				type: this.type,	// channel, direct, file
				token: this.otherUserData.accessToken,	// the other user will create the stream
				teamId: this.repo.teamId,
				repoId: this.type === 'file' ? this.repo._id : null,
				// only needed for channel/direct type streams, add me to members or not as needed for the test
				memberIds: this.withoutMeInStream || this.type === 'file' ? null : [this.currentUser._id]
			}
		);
	}

	// create a series of posts in the stream, we'll fetch some subset of these for the test
	createPosts (callback) {
		this.myPosts = [];
		this.myMarkers = [];
		this.myMarkerLocations = [];
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
				this.myPosts.push(response.post);
				if (response.markers) {
					this.myMarkers.push(...response.markers);
				}
				if (response.markerLocations) {
					let markerLocations = response.markerLocations[0];
					let locations = markerLocations.locations;
					delete markerLocations.locations;
					Object.assign(this.myMarkerLocations, markerLocations);
					this.myMarkerLocations.locations = this.myMarkerLocations.locations || {};
					Object.assign(this.myMarkerLocations.locations, locations);
				}
				setTimeout(callback, this.postCreateThrottle || 0);
			},
			postOptions
		);
	}

	// set options for creating a singe post in the stream, depending upon the
	// ordinal number of the post
	setPostOptions (n) {
		let iAmInStream = !this.withoutMeOnTeam && !this.withoutMeInStream;	// i can't create the post if i'm not in the stream or team
		let mine = iAmInStream && n % 2 === 1;	// when i can be a creator of the post, we'll alternate between me and the other user
		let postOptions = {
			token: mine ? this.token : this.otherUserData.accessToken,
			streamId: this.stream._id,
			repoId: this.type === 'file' ? this.repo._id : null,
			wantCodeBlocks: this.type === 'file' ? 1 : false	// we'll do a code blcok for file-type streams
		};
		return postOptions;
	}

	// set the path to use for the fetch request
	setPath (callback) {
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}`;
		callback();
	}

	// validate the response to the fetch request
	validateResponse (data) {
		// we expect certain posts, and we expect their attributes are sanitized (devoid
		// of attributes that should not go to the client)
		this.validateMatchingObjects(data.posts, this.myPosts, 'posts');
		this.validateSanitizedObjects(data.posts, PostTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetPostsTest;
