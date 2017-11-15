'use strict';

var CodeStream_Message_Test = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class New_File_Stream_Message_To_Team_Test extends CodeStream_Message_Test {

	get description () {
		return 'members of the team should receive a message with the stream when a post is posted to a file stream created on the fly';
	}

	make_data (callback) {
		Bound_Async.series(this, [
			this.create_team_creator,
			this.create_post_creator,
			this.create_repo
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
					this.post_creator_data.user.email
				],
				with_random_emails: 1,
				token: this.team_creator_data.access_token
			}
		);
	}

	set_channel_name (callback) {
		this.channel_name = 'team-' + this.team._id;
		callback();
	}

	generate_message (callback) {
		let stream_options = {
			type: 'file',
			file: this.stream_factory.random_file(),
			team_id: this.team._id,
			repo_id: this.repo._id,
		};
		this.post_factory.create_random_post(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { stream: response.stream };
				callback();
			},
			{
				token: this.post_creator_data.access_token,
				team_id: this.team._id,
				want_location: true,
				stream: stream_options
			}
		);
	}
}

module.exports = New_File_Stream_Message_To_Team_Test;
