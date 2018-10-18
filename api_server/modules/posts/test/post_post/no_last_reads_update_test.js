'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NoLastReadsUpdateTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		Object.assign(this.streamOptions, {
			type: this.type || 'channel',
			creatorIndex: 1
		});
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			numPosts: 3
		});
		if (this.type === 'file') {
			this.repoOptions.creatorIndex = 1;
		}
	}

	get description () {
		return 'last read attribute should not be updated for members of the stream who already have a last read attribute for the stream';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.markRead,			// mark the previously created posts as "read"
			this.createLastPosts	// create an additional post in the stream, this will be "unread"
		], callback);
	}

	get method () {
		return 'get';
	}

	get path () {
		// the test is to check the lastReads attribute for the stream, which we
		// get when we fetch the user's own user object
		return '/users/me';
	}

	getExpectedFields () {
		return { user: ['lastReads'] };
	}

	// mark the posts in the stream we created "read" for the current user
	markRead (callback) {
		this.doApiRequest({
			method: 'put',
			path: '/read/' + this.stream._id,
			token: this.token
		}, callback);
	}

	// create some additional posts in the stream, these will go "unread"
	createLastPosts (callback) {
		this.lastPosts = [];	// lastPosts will be the posts that will go unread
		this.currentPosts = this.lastPosts;	// currentPosts will be the array we add the posts to
		BoundAsync.timesSeries(
			this,
			2,
			this.createPost,
			callback
		);
	}

	// create a single post in the stream we created
	createPost (n, callback) {
		const postOptions = {
			streamId: this.stream._id,
			token: this.users[1].accessToken	// the "other user" will create the posts
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				// "currentPosts" refer to the posts we are tracking ... firstPosts for the "read" ones, lastPosts for the "unread" ones
				this.currentPosts.push(response.post);
				callback();
			},
			postOptions
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// we fetched the user's "user" object, we should see their lastReads attribute
		// for the created stream set to the last post of the first batch we created,
		// which we marked as read for the current user
		const firstPosts = this.postData.map(postData => postData.post);
		const lastReadPost = firstPosts[firstPosts.length - 1];
		Assert(data.user.lastReads[this.stream._id] === lastReadPost.seqNum, 'lastReads for stream is not equal to the seqNum of the last post read');
	}
}

module.exports = NoLastReadsUpdateTest;
