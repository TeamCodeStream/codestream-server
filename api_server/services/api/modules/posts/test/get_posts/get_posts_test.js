'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const Post_Test_Constants = require('../post_test_constants');

class Get_Post_Test extends CodeStream_API_Test {

	constructor (options) {
		super(options);
		this.type = this.type || 'channel';
		this.num_posts = 5;
	}

	get description () {
		return `should return the correct posts when requesting posts in a ${this.type} stream`;
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_random_repo,
			this.create_stream,
			this.create_posts,
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
				with_emails: [this.current_user.email],
				token: this.other_user_data.access_token
			}
		);
	}

	create_stream (callback) {
		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: this.type,
				token: this.other_user_data.access_token,
				team_id: this.repo.team_id,
				repo_id: this.type === 'file' ? this.repo._id : null
			}
		);
	}

	create_posts (callback) {
		this.my_posts = [];
		Bound_Async.timesSeries(
			this,
			this.num_posts,
			this.create_post,
			callback
		);
	}

	create_post (n, callback) {
		let post_options = this.set_post_options(n);
		this.post_factory.create_random_post(
			(error, response) => {
				if (error) { return callback(error); }
				this.my_posts.push(response.post);
				callback();
			},
			post_options
		);
	}

	set_post_options (n) {
		let mine = n % 2 === 1;
		let post_options = {
			token: mine ? this.token : this.other_user_data.access_token,
			stream_id: this.stream._id,
			repo_id: this.type === 'file' ? this.repo._id : null,
			want_location: this.type === 'file'
		};
		return post_options;
	}

	set_path (callback) {
		this.path = '/posts/?stream_id=' + this.stream._id;
		callback();
	}

	validate_response (data) {
		this.validate_matching_objects(data.posts, this.my_posts, 'posts');
		this.validate_sanitized_objects(data.posts, Post_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Get_Post_Test;
