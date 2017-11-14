'use strict';

var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Most_Recent_Post_Test extends CodeStream_API_Test {

	get description () {
		return 'most_recent_post_id for the stream should get updated to the post when a post is created in the stream';
	}

	get method () {
		return 'get';
	}

	get_expected_fields () {
		return { stream: ['most_recent_post_id'] };
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_repo,
			this.create_stream,
			this.create_posts
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

	create_repo (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				with_emails: [this.current_user.email],
				with_random_emails: 1,
				token: this.other_user_data.access_token
			}
		);
	}

	create_stream (callback) {
		let stream_options = {
			type: 'file',
			team_id: this.team._id,
			repo_id: this.repo._id,
			token: this.other_user_data.access_token
		};
		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				this.path = '/streams/' + this.stream._id;
				callback();
			},
			stream_options
		);
	}

	create_posts (callback) {
		this.posts = [];
		Bound_Async.timesSeries(
			this,
			3,
			this.create_post,
			callback
		);
	}

	create_post (n, callback) {
		let post_options = {
			stream_id: this.stream._id,
			token: this.other_user_data.access_token
		};
		this.post_factory.create_random_post(
			(error, response) => {
				if (error) { return callback(error); }
				this.posts.push(response.post);
				callback();
			},
			post_options
		);
	}

	validate_response (data) {
		Assert(data.stream.most_recent_post_id === this.posts[this.posts.length - 1]._id, 'most_recent_post_id for stream does not match post');
	}
}

module.exports = Most_Recent_Post_Test;
