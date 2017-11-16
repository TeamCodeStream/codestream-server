'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const PostTestConstants = require('../post_test_constants');

class GetPostTest extends CodeStreamAPITest {

	get description () {
		let who = this.mine ? 'me' : 'another user';
		return `should return a valid post when requesting a post created by ${who} in a ${this.type} stream`;
	}

	getExpectedFields () {
		let response = { post: PostTestConstants.EXPECTED_POST_FIELDS };
		if (this.type === 'file') {
			response.post = [...response.post, ...PostTestConstants.EXPECTED_FILE_POST_FIELDS];
		}
		return response;
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRandomRepo,
			this.createStream,
			this.createPost,
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
				callback();
			},
			{
				withRandomEmails: 2,
				withEmails: this.withoutMe ? null : [this.currentUser.email],
				token: this.otherUserData.accessToken
			}
		);
	}

	createStream (callback) {
		let streamOptions = {
			type: this.type,
			token: this.mine ? this.token : this.otherUserData.accessToken,
			teamId: this.repo.teamId,
			repoId: this.type === 'file' ? this.repo._id : null,
		};
		if (this.type !== 'file' && !this.mine && !this.withoutMe) {
			streamOptions.memberIds = [this.currentUser._id];
		}
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			streamOptions
		);
	}

	createPost (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				callback();
			},
			{
				token: this.mine ? this.token : this.otherUserData.accessToken,
				streamId: this.stream._id,
				repoId: this.type === 'file' ? this.repo._id : null,
				wantLocation: this.type === 'file'
			}
		);
	}

	setPath (callback) {
		this.path = '/posts/' + this.post._id;
		callback();
	}

	validateResponse (data) {
		this.validateMatchingObject(this.post._id, data.post, 'post');
		this.validateSanitized(data.post, PostTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetPostTest;
