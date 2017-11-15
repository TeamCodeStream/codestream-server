'use strict';

var CodeStream_Message_Test = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Read_Message_Test extends CodeStream_Message_Test {

	get description () {
		return 'the user should receive a message on their me-channel when they indicate they have read all messages in a stream';
	}

	make_data (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_repo,
			this.create_stream,
			this.create_other_stream,
			this.create_post,
			this.create_other_post
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
				callback();
			},
			stream_options
		);
	}

	create_other_stream (callback) {
		let stream_options = {
			type: 'file',
			team_id: this.team._id,
			repo_id: this.repo._id,
			token: this.other_user_data.access_token
		};
		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_stream = response.stream;
				callback();
			},
			stream_options
		);
	}

	create_post (callback) {
		let post_options = {
			stream_id: this.stream._id,
			token: this.other_user_data.access_token
		};
		this.post_factory.create_random_post(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				callback();
			},
			post_options
		);
	}

	create_other_post (callback) {
		let post_options = {
			stream_id: this.other_stream._id,
			token: this.other_user_data.access_token
		};
		this.post_factory.create_random_post(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_post = response.post;
				callback();
			},
			post_options
		);
	}

	set_channel_name (callback) {
		this.channel_name = 'user-' + this.current_user._id;
		callback();
	}

	generate_message (callback) {
		this.do_api_request(
			{
				method: 'put',
				path: '/read/' + this.stream._id,
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				this.message = {
					user: {
						_id: this.current_user._id,
						unset: {
							['last_reads.' + this.stream._id]: true
						}
					}
				};
				callback();
			}
		);
	}
}

module.exports = Read_Message_Test;
