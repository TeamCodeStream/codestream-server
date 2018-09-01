// base class for many tests of the "POST /posts" requests

'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const PostTestConstants = require('../post_test_constants');

class PostPostTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.testOptions = {};
	}

	get description () {
		return 'should return a valid post when creating a post in a direct stream (simplest case: me-group)';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/posts';
	}

	getExpectedFields () {
		return { post: PostTestConstants.EXPECTED_POST_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create another registered user
			this.createRandomRepo,	// create a random repo (and team) for the test
			this.makeStreamOptions,	// make options associated with the stream that will be created
			this.createRandomStream,	// create the stream
			this.makePostOptions,	// make post options associated with the post that will be created
			this.createOtherPost,	// create another post (before the test post), as needed
			this.makePostData		// make the data associated with the test post to be created
		], callback);
	}

	// create another registered user (in addition to the "current" user)
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a random repo to use for the test
	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				withEmails: [this.currentUser.email],	// include current user
				withRandomEmails: 2,	// and 2 other users for good measure
				token: this.otherUserData.accessToken	// the "other user" is the repo and team creator
			}
		);
	}

	// introduce additional remotes to the repo we created by
	// submitting a post and creating a stream on the fly as we do it,
	// with remotes specified in the code block for the post
	addRemotesToRepo (callback) {
		if (!this.wantRemotes) {
			return callback();
		}
		this.postFactory.createRandomPost(
			callback,
			{
				wantCodeBlocks: 1,
				stream: {
					type: 'channel',
					name: this.streamFactory.randomName()
				},
				codeBlockStream: {
					file: this.repoFactory.randomFile(),
					remotes: this.wantRemotes
				}
			}
		);
	}
	
	// form options to use in creating the stream that will be used for the test
	makeStreamOptions (callback) {
		this.streamOptions = {
			type: this.streamType || 'direct',	// stream type as specified for the test
			teamId: this.team._id,	// create the stream in the team we already created
			token: this.token	// current user is the stream creator
		};
		callback();
	}

	// create a random stream to use for the test
	createRandomStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			this.streamOptions
		);
	}

	// form options to be used when creating the test post
	makePostOptions (callback) {
		this.postOptions = {
			streamId: this.stream._id	// create the post in the stream we already created
		};
		callback();
	}

	// create another post, in addition to the post we will create as part of the test
	createOtherPost (callback) {
		if (!this.testOptions.wantOtherPost) {	// as specified by the derived test
			return callback();
		}
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherPostData = response;
				callback();
			},
			// have the "other user" create the other post
			Object.assign({}, this.postOptions, { token: this.otherUserData.accessToken })
		);
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		this.postCreatedAfter = Date.now();
		this.postFactory.getRandomPostData(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = data;
				callback();
			},
			this.postOptions
		);
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateResponse (data) {
		// verify we got back a post with the attributes we specified
		let post = data.post;
		let errors = [];
		let expectedSeqNum = this.testOptions.expectedSeqNum || 1;
		let expectedOrigin = this.testOptions.expectedOrigin || '';
		let result = (
			((post.text === this.data.text) || errors.push('text does not match')) &&
			((post.teamId === this.team._id) || errors.push('teamId does not match the team')) &&
			((post.streamId === this.data.streamId) || errors.push('streamId does not match')) &&
			((post.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof post.createdAt === 'number') || errors.push('createdAt not number')) &&
			((post.modifiedAt >= post.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((post.creatorId === this.currentUser._id) || errors.push('creatorId not equal to current user id')) &&
			((post.seqNum === expectedSeqNum) || errors.push('seqNum not equal to expected seqNum')) &&
			((post.origin === expectedOrigin) || errors.push('origin not equal to expected origin'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));

		// verify we also got a stream update
		this.validateStreamUpdate(data);

		// verify the post in the response has no attributes that should not go to clients
		this.validateSanitized(post, PostTestConstants.UNSANITIZED_ATTRIBUTES);
	}

	// verify we got the expected stream update in the response
	validateStreamUpdate (data) {
		if (!this.stream) { return; }
		const streamUpdate = data.streams.find(stream => stream._id === this.stream._id);
		Assert.equal(streamUpdate.$set.mostRecentPostId, data.post._id, 'mostRecentPostID of stream update is not set to the ID of the most recent post');
		Assert.equal(streamUpdate.$set.sortId, data.post._id, 'sortId of stream update is not set to the ID of the most recent post');
		Assert(streamUpdate.$set.mostRecentPostCreatedAt > this.postCreatedAfter, 'mostRecentPostCreatedAt of stream update is not set to after the post was created');
	}
}

module.exports = PostPostTest;
