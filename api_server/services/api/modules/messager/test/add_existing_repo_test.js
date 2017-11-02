'use strict';

var CodeStream_Message_Test = require('./codestream_message_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Add_Existing_Repo_Test extends CodeStream_Message_Test {

	get description () {
		return 'should be able to subscribe to and receive a message from the team channel when i introduce a repo to an existing team';
	}

	make_data (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_repo_without_me,
			this.create_same_repo
		], callback);
	}

	// create another user who will create the repo with me added to the team
	create_other_user (callback) {
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_user_data = response;
				callback();
			}
		);
	}

	// create a repo and a team without me as a member
	create_repo_without_me (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				with_random_emails: 2,
				token: this.other_user_data.access_token
			}
		);
	}
	// create a repo and a team with me as a member, since a team has already been created,
	// this just adds me to the existing team
	create_same_repo (callback) {
		let repo_data = {
			url: this.repo.url,
			first_commit_sha: this.repo.first_commit_sha,
			team_id: this.team._id,
			emails: [this.current_user.email]
		};
		this.repo_factory.create_repo(
			repo_data,
			this.other_user_data.access_token,
			callback
		);
	}

	set_channel_name (callback) {
		this.channel_name = 'team-' + this.team._id;
		callback();
	}
}

module.exports = Add_Existing_Repo_Test;
