'use strict';

var CodeStream_Message_Test = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');

class Users_Join_New_Team_Message_Test extends CodeStream_Message_Test {

	get description () {
		return 'users added to a team when a repo and team are created should receive a message that they have been added to the team';
	}

	make_data (callback) {
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error);}
				this.other_user_data = response;
				callback();
			}
		);
	}

	set_channel_name (callback) {
		this.channel_name = 'user-' + this.current_user._id;
		callback();
	}


	generate_message (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = {
					users: [{
						_id: this.current_user._id,
						$add: {
							team_ids: response.team._id
						}
					}]
				};
				callback();
			},
			{
				with_emails: [this.current_user.email],
				with_random_emails: 1,
				token: this.other_user_data.access_token
			}
		);
	}
}

module.exports = Users_Join_New_Team_Message_Test;
