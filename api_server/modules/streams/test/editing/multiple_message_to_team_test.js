'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const MultipleCommonInit = require('./multiple_common_init');

class MultipleMessageToTeamTest extends Aggregation(CodeStreamMessageTest, MultipleCommonInit) {

	get description () {
		return 'members of the team should receive a message with the correct set of ops when user indicates a complete list of files they are editing';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the team channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the
		// team channel with the updated post
		this.doApiRequest(
			{
				method: 'put',
				path: '/editing',
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				callback();
			}
		);
	}

	// validate the message received
	validateMessage (message) {
		this.confirmResponse(message.message);
		return true;
	}
}

module.exports = MultipleMessageToTeamTest;
