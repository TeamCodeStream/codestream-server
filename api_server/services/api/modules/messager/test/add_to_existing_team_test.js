'use strict';

var CodeStream_Message_Test = require('./codestream_message_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Add_To_Existing_Team_Test extends CodeStream_Message_Test {

	get description () {
		return 'should be able to subscribe to and receive a message from the team channel when i am added to an existing team';
	}

	make_data (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_repo_without_me,
			this.create_repo_with_me
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
	create_repo_with_me (callback) {
		this.repo_factory.create_random_repo(
			callback,
			{
				team_id: this.team._id,
				with_emails: [this.current_user.email],
				token: this.other_user_data.access_token
			}
		);
	}

	set_channel_name (callback) {
		this.channel_name = 'team-' + this.team._id;
		callback();
	}
}

module.exports = Add_To_Existing_Team_Test;
