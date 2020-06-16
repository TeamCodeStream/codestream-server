'use strict';

var Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
var CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
var CommonInit = require('./common_init');

class MessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.attributes = this.attributes || ['username', 'fullName'];
	}

	get description () {
		return 'members of the team should receive a message with the user when a user updates themselves';
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
		this.message = {
			users: [
				this.expectedData.user
			]
		};
		Object.assign(this.message.users[0].$set, this.data);
		this.updateUser(error => {
			if (error) { return callback(error); }
			this.message.users[0].$set.modifiedAt = this.expectedUser.modifiedAt;
			callback();
		});
	}
}

module.exports = MessageToTeamTest;
