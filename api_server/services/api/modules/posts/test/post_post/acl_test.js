'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class ACL_Test extends CodeStream_API_Test {

	get method () {
		return 'post';
	}

	get path () {
		return '/posts';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1011'
		};
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_random_repo,
			this.create_random_stream,
			this.make_post_options,
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
				callback();
			},
			{
				with_emails: this.without_me_on_team ? null : [this.current_user.email],
				with_random_emails: 2,
				token: this.other_user_data.access_token
			}
		);
	}

	create_random_stream (callback) {
		this.stream_options = {
			type: this.type || 'channel',
			team_id: this.team._id,
			repo_id: this.type === 'file' ? this.repo._id : null,
			token: this.other_user_data.access_token,
			member_ids: this.without_me_in_stream ? null : [this.current_user._id]
		};
		if (this.on_the_fly) {
			return callback();
		}
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
		if (this.stream) {
			this.post_options = {
				stream_id: this.stream._id
			};
			callback();
		}
		else {
			this.stream_factory.get_random_stream_data(
				(error, data) => {
					if (error) { return callback(error); }
					this.post_options = { stream: data };
					callback();
				},
				this.stream_options
			);
		}
	}

	make_post_data (callback) {
		this.post_options.team_id = this.team._id;
		this.post_factory.get_random_post_data(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = data;
				callback();
			},
			this.post_options
		);
	}
}

module.exports = ACL_Test;
