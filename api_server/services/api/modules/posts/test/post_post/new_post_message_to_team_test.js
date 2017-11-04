'use strict';

var CodeStream_Message_Test = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class New_Post_Message_To_Team_Test extends CodeStream_Message_Test {

	get description () {
		return 'members of the team should receive a message with the post when a post is posted to a file stream';
	}

	make_data (callback) {
		Bound_Async.series(this, [
			this.create_team_creator,
			this.create_stream_creator,
			this.create_post_creator,
			this.create_repo,
			this.create_stream
		], callback);
	}

	create_team_creator (callback) {
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error);}
				this.team_creator_data = response;
				callback();
			}
		);
	}

	create_stream_creator (callback) {
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error);}
				this.stream_creator_data = response;
				callback();
			}
		);
	}

	create_post_creator (callback) {
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error);}
				this.post_creator_data = response;
				callback();
			}
		);
	}

	create_repo (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				with_emails: [
					this.current_user.email,
					this.stream_creator_data.user.email,
					this.post_creator_data.user.email
				],
				with_random_emails: 1,
				token: this.team_creator_data.access_token
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
				type: 'file',
				team_id: this.team._id,
				repo_id: this.repo._id,
				token: this.stream_creator_data.access_token
			}
		);
	}

	set_channel_name (callback) {
		this.channel_name = 'team-' + this.team._id;
		callback();
	}

	generate_message (callback) {
		this.post_factory.create_random_post(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { post: response.post };
				callback();
			},
			{
				token: this.post_creator_data.access_token,
				team_id: this.team._id,
				stream_id: this.stream._id,
				want_location: true
			}
		);
	}
}

module.exports = New_Post_Message_To_Team_Test;
