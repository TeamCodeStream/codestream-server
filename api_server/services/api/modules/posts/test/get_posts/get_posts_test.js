'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
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

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRandomRepo,
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

	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withRandomEmails: 2,
				withEmails: this.withoutMeOnTeam ? null : [this.currentUser.email],
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
				type: this.type,
				token: this.otherUserData.accessToken,
				teamId: this.repo.teamId,
				repoId: this.type === 'file' ? this.repo._id : null,
				memberIds: this.withoutMeInStream || this.type === 'file' ? null : [this.currentUser._id]
			}
		);
	}

	createPosts (callback) {
		this.myPosts = [];
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
				this.myPosts.push(response.post);
				callback();
			},
			postOptions
		);
	}

	setPostOptions (n) {
		let iAmInStream = !this.withoutMeOnTeam && !this.withoutMeInStream;
		let mine = iAmInStream && n % 2 === 1;
		let postOptions = {
			token: mine ? this.token : this.otherUserData.accessToken,
			streamId: this.stream._id,
			repoId: this.type === 'file' ? this.repo._id : null,
			wantLocation: this.type === 'file'
		};
		return postOptions;
	}

	setPath (callback) {
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}`;
		callback();
	}

	validateResponse (data) {
		this.validateMatchingObjects(data.posts, this.myPosts, 'posts');
		this.validateSanitizedObjects(data.posts, PostTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetPostsTest;
