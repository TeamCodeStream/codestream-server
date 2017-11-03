'use strict';

var CodeStream_Message_Test = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Users_Join_Existing_Repo_Message_Test extends CodeStream_Message_Test {

	get description () {
		return 'users added to a team when a repo that already exists is introduced should receive a message that they have been added to the team';
	}

	make_data (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_repo
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
				with_random_emails: 1,
				token: this.other_user_data.access_token
			}
		);
	}

	set_channel_name (callback) {
		this.channel_name = 'user-' + this.current_user._id;
		callback();
	}


	generate_message (callback) {
		let repo_data = {
			team_id: this.team._id,
			url: this.repo.url,
			first_commit_sha: this.repo.first_commit_sha,
			emails: [this.current_user.email]
		};
		this.repo_factory.create_repo(
			repo_data,
			this.other_user_data.access_token,
			error => {
				if (error) { return callback(error); }
				this.message = {
					users: [{
						_id: this.current_user._id,
						$add: {
							team_ids: this.team._id
						}
					}]
				};
				callback();
			}
		);
	}
}

module.exports = Users_Join_Existing_Repo_Message_Test;
