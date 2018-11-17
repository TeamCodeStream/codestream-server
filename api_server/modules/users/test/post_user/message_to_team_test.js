'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const CommonInit = require('./common_init');

class MessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team should receive a message with the user when a user is added to the team';
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
				method: 'post',
				path: '/users',
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				this.message.team = {
					_id: this.team.id,	// DEPRECATE ME
					id: this.team.id,
					$addToSet: {
						memberIds: response.user.id
					},
					$set: {
						version: 6
					},
					$version: {
						before: 5,
						after: 6
					}
				};
				callback();
			}
		);
	}
}

module.exports = MessageToTeamTest;
