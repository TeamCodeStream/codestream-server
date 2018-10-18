'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const PostTestConstants = require('../post_test_constants');

class GetPostsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.type = this.type || 'channel';
		this.teamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.streamOptions, {
			creatorIndex: 1,
			type: this.type || 'channel'
		});
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			numPosts: 5,
			type: this.type || 'channel'
		});
	}

	get description () {
		return `should return the correct posts when requesting posts in a ${this.type} stream`;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath			// set the path for our request to retrieve posts
		], callback);
	}



	/*
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
*/



	// set the path to use for the fetch request
	setPath (callback) {
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}`;
		this.expectedPosts = this.postData.map(postData => postData.post);
		callback();
	}

	// validate the response to the fetch request
	validateResponse (data) {
		// we expect certain posts, and we expect their attributes are sanitized (devoid
		// of attributes that should not go to the client)
		this.validateMatchingObjects(data.posts, this.expectedPosts, 'posts');
		this.validateSanitizedObjects(data.posts, PostTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetPostsTest;
