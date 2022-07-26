'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const RemoveUserTest = require('./remove_user_test');
const Assert = require('assert');

class SetV3BroadcasterTokenTest extends Aggregation(RemoveUserTest, CodeStreamMessageTest) {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress messages ordinarily, but since we're actually testing them...
	}

	get description () {
		return 'when a user is removed from a company, the user should receive a message to update their V3 PubNub Access Manager issued broadcaster token';
	}

	makeData (callback) {
		this.init(error => {
			if (error) { return callback(error); }
			const removedUsers = this.getRemovedUsers();
			this.listeningUser = this.users.find(u => u.user.id === removedUsers[0].id);
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = 'user-' + this.listeningUser.user.id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.updateTeam(callback);
	}

	validateMessage (message) {
		if (!message.message.setBroadcasterV3Token) { return false; }
		Assert(typeof message.message.setBroadcasterV3Token === 'string');
		return true;
	}
}

module.exports = SetV3BroadcasterTokenTest;
