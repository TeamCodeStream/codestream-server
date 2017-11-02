'use strict';

var CodeStream_Message_Test = require('./codestream_message_test');

class Team_Channel_Test extends CodeStream_Message_Test {

	get description () {
		return 'should be able to subscribe to and receive a message from the team channels for all my teams as a confirmed user';
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

module.exports = Team_Channel_Test;
