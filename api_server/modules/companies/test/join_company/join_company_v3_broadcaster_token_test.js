'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class JoinCompanyV3BroadcasterTokenTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'when a user joins a company, they should receive a message to update their V3 PubNub Access Manager issued broadcaster token';
	}

	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser.user.id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.doJoin(callback);
	}

	validateMessage (message) {
		if (!message.message.setBroadcasterV3Token) { return false; }
		Assert(typeof message.message.setBroadcasterV3Token === 'string');
		return true;
	}
}

module.exports = JoinCompanyV3BroadcasterTokenTest;
