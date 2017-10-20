'use strict';

var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const Post_Test_Constants = require('../post_test_constants');

class Post_Post_Test extends CodeStream_API_Test {

	constructor (options) {
		super(options);
		this.test_options = {};
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

	get_expected_fields () {
		return { post: Post_Test_Constants.EXPECTED_POST_FIELDS };
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_random_repo,
			this.make_stream_options,
			this.create_random_stream,
			this.make_post_options,
			this.create_other_post,
			this.make_post_data
		], callback);
	}

	create_other_user (callback) {
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_user_data = response;
				callback();
			}
		);
	}

	create_random_repo (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				with_random_emails: 2,
				token: this.other_user_data.access_token
			}
		);
	}

	make_stream_options (callback) {
		this.stream_options = {
			type: this.stream_type || 'direct',
			team_id: this.team._id,
			token: this.other_user_data.access_token
		};
		callback();
	}

	create_random_stream (callback) {
		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			this.stream_options
		);
	}

	make_post_options (callback) {
		this.post_options = {
			stream_id: this.stream._id
		};
		callback();
	}

	create_other_post (callback) {
		if (!this.test_options.want_other_post) {
			return callback();
		}
		this.post_factory.create_random_post(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_post_data = response;
				callback();
			},
			Object.assign({}, this.post_options, { token: this.other_user_data.access_token })
		);
	}

	make_post_data (callback) {
		this.post_factory.get_random_post_data(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = data;
				callback();
			},
			this.post_options
		);
	}

	validate_response (data) {
		let post = data.post;
		let errors = [];
		let result = (
			((post.text === this.data.text) || errors.push('text does not match')) &&
			((post.team_id === this.team._id) || errors.push('team_id does not match the team')) &&
			((post.stream_id === this.data.stream_id) || errors.push('stream_id does not match')) &&
			((post.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof post.created_at === 'number') || errors.push('created_at not number')) &&
			((post.modified_at >= post.created_at) || errors.push('modified_at not greater than or equal to created_at')) &&
			((post.creator_id === this.current_user._id) || errors.push('creator_id not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		this.validate_sanitized(post, Post_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Post_Post_Test;
