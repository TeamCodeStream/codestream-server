'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const Post_Test_Constants = require('../post_test_constants');

class Get_Post_Test extends CodeStream_API_Test {

	get description () {
		let who = this.mine ? 'me' : 'another user';
		return `should return a valid post when requesting a post created by ${who} in a ${this.type} stream`;
	}

	get_expected_fields () {
		let response = { post: Post_Test_Constants.EXPECTED_POST_FIELDS };
		if (this.type === 'file') {
			response.post = [...response.post, ...Post_Test_Constants.EXPECTED_FILE_POST_FIELDS];
		}
		return response;
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_random_repo,
			this.create_stream,
			this.create_post,
			this.set_path
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
				callback();
			},
			{
				with_random_emails: 2,
				with_emails: this.without_me ? null : [this.current_user.email],
				token: this.other_user_data.access_token
			}
		);
	}

	create_stream (callback) {
		let stream_options = {
			type: this.type,
			token: this.mine ? this.token : this.other_user_data.access_token,
			team_id: this.repo.team_id,
			repo_id: this.type === 'file' ? this.repo._id : null,
		};
		if (this.type !== 'file' && !this.mine && !this.without_me) {
			stream_options.member_ids = [this.current_user._id];
		}
		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			stream_options
		);
	}

	create_post (callback) {
		this.post_factory.create_random_post(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				callback();
			},
			{
				token: this.mine ? this.token : this.other_user_data.access_token,
				stream_id: this.stream._id,
				repo_id: this.type === 'file' ? this.repo._id : null,
				want_location: this.type === 'file'
			}
		);
	}

	set_path (callback) {
		this.path = '/posts/' + this.post._id;
		callback();
	}

	validate_response (data) {
		this.validate_matching_object(this.post._id, data.post, 'post');
		this.validate_sanitized(data.post, Post_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Get_Post_Test;
