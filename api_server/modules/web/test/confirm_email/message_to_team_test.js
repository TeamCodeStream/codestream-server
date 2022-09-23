'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

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
		this.testBegins = Date.now();
		this.doApiRequest(
			{
				method: 'get',
				path: this.path,
				requestOptions: {
					noJsonInResponse: true,
					expectRedirect: true
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { 
					users: [{
						_id: this.currentUser.user.id,	// DEPRECATE ME
						id: this.currentUser.user.id,
						$set: {
							email: this.newEmail,
							version: 5
						},
						$version: {
							before: 4,
							after: 5
						}
					}]					
				};
				callback();
			}
		);
	}

	validateMessage (message) {
		Assert(message.message.users[0].$set.modifiedAt >= this.testBegins, 'modifiedAt not set to greater than or equal to when the test began');
		this.message.users[0].$set.modifiedAt = message.message.users[0].$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = MessageToTeamTest;
