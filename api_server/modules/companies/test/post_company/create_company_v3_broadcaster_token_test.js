'use strict';

const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const Assert = require('assert');

class CreateCompanyV3BroadcasterTokenTest extends CodeStreamMessageTest {

	get description () {
		return 'when a user creates a company, they should receive a message to update their V3 PubNub Access Manager issued broadcaster token';
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser.user.id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.companyFactory.createRandomCompany(callback, { token: this.currentUser.accessToken });
	}

	validateMessage (message) {
		if (!message.message.setBroadcasterV3Token) { return false; }
		Assert(typeof message.message.setBroadcasterV3Token === 'string');
		return true;
	}
}

module.exports = CreateCompanyV3BroadcasterTokenTest;
