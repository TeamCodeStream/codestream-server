'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const CommonInit = require('./common_init');

class MessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team should receive a message with the changed email when a user confirms a change of email';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the team channel
		this.channelName = 'team-' + this.team.id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the
		// team channel with the updated post
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/change-email-confirm',
				data: this.data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { users: [response.user] };
				callback();
			}
		);
	}
}

module.exports = MessageToTeamTest;
