'use strict';

var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class No_Last_Reads_For_Author_Test extends CodeStream_API_Test {

	get description () {
		return `last read attribute for the post author should not be updated when a new post is created in a stream`;
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_team_creator,
			this.create_other_user,
			this.create_repo,
			this.create_stream,
			this.create_posts
		], callback);
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/users/me';
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
			type: 'file',
			team_id: this.team._id,
			repo_id: this.repo._id,
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
			token: this.token
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
		Assert(!data.user.last_reads, 'last_reads exists');
	}
}

module.exports = No_Last_Reads_For_Author_Test;
