'use strict';

var CodeStream_Message_ACL_Test = require('./codestream_message_acl_test');

class Team_Channel_ACL_Test extends CodeStream_Message_ACL_Test {

	get description () {
		return 'should get an error when trying to subscribe to a team channel for a team i am not a member of';
	}

	make_data (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			},
			{
				with_random_emails: 2,
				token: this.token
			}
		);
	}

	set_channel_name (callback) {
		this.channel_name = 'team-' + this.team._id;
		callback();
	}
}

module.exports = Team_Channel_ACL_Test;
