'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
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

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRandomRepo,
			this.makeStreamOptions,
			this.createRandomStream,
			this.makePostOptions,
			this.createOtherPost,
			this.makePostData
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
				this.users = response.users;
				callback();
			},
			{
				withEmails: [this.currentUser.email],
				withRandomEmails: 2,
				token: this.otherUserData.accessToken
			}
		);
	}

	makeStreamOptions (callback) {
		this.streamOptions = {
			type: this.streamType || 'direct',
			teamId: this.team._id,
			token: this.token
		};
		callback();
	}

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

	makePostOptions (callback) {
		this.postOptions = {
			streamId: this.stream._id
		};
		callback();
	}

	createOtherPost (callback) {
		if (!this.testOptions.wantOtherPost) {
			return callback();
		}
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherPostData = response;
				callback();
			},
			Object.assign({}, this.postOptions, { token: this.otherUserData.accessToken })
		);
	}

	makePostData (callback) {
		this.postFactory.getRandomPostData(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = data;
				callback();
			},
			this.postOptions
		);
	}

	validateResponse (data) {
		let post = data.post;
		let errors = [];
		let expectedSeqNum = this.testOptions.expectedSeqNum || 1;
		let result = (
			((post.text === this.data.text) || errors.push('text does not match')) &&
			((post.teamId === this.team._id) || errors.push('teamId does not match the team')) &&
			((post.streamId === this.data.streamId) || errors.push('streamId does not match')) &&
			((post.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof post.createdAt === 'number') || errors.push('createdAt not number')) &&
			((post.modifiedAt >= post.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((post.creatorId === this.currentUser._id) || errors.push('creatorId not equal to current user id')) &&
			((post.seqNum === expectedSeqNum) || errors.push('seqNum not equal to expected seqNum'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		this.validateSanitized(post, PostTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PostPostTest;
