'use strict';

var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Last_Reads_Previous_Post_Test extends CodeStream_API_Test {

	get description () {
		return `last read attribute for members of the stream should get updated to the previous post when a new post is created in a ${this.type} stream, for members who are not caught up on the conversation`;
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_team_creator,
			this.create_other_user,
			this.create_repo,
			this.create_stream,
			this.create_first_posts,
			this.mark_read,
			this.create_last_post
		], callback);
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/users/me';
	}

	get_expected_fields () {
		return { user: ['last_reads'] };
	}

	create_team_creator (callback) {
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error); }
				this.team_creator_data = response;
				callback();
			}
		);
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
				with_emails: [this.current_user.email, this.other_user_data.user.email],
				token: this.team_creator_data.access_token
			}
		);
	}

	create_stream (callback) {
		let stream_options = {
			type: this.type,
			team_id: this.team._id,
			repo_id: this.type === 'file' ? this.repo._id : null,
			member_ids: this.type === 'file' ? null : [this.current_user._id, this.other_user_data.user._id],
			token: this.team_creator_data.access_token
		};
		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			stream_options
		);
	}

	create_first_posts (callback) {
		this.first_posts = [];
		Bound_Async.timesSeries(
			this,
			2,
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
				this.first_posts.push(response.post);
				callback();
			},
			post_options
		);
	}

	mark_read (callback) {
		this.do_api_request({
			method: 'put',
			path: '/read/' + this.stream._id,
			token: this.token
		}, callback);
	}

	create_last_post (callback) {
		let post_options = {
			stream_id: this.stream._id,
			token: this.other_user_data.access_token
		};
		this.post_factory.create_random_post(
			(error, response) => {
				if (error) { return callback(error); }
				this.last_post = response.post;
				callback();
			},
			post_options
		);
	}

	validate_response (data) {
		let last_post = this.first_posts[this.first_posts.length - 1];
		Assert(data.user.last_reads[this.stream._id] === last_post._id, 'last_reads for stream is not equal to the ID of the last post read');
	}
}

module.exports = Last_Reads_Previous_Post_Test;
