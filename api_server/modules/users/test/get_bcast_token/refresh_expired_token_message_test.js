'use strict';

const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const Assert = require('assert');

class RefreshExpiredTokenMessageTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.useV3BroadcasterToken = true;
		this.setV3TokenTTL = this.mockMode ? 1/60 : 1;
		this.userOptions.numRegistered = 1;
		this.messageReceiveTimeout = this.mockMode ? 5000 : 70000;
	}
	
	get description () {
		return 'when a V3 PubNub Access Manager issues broadcaster token expires, and a user fetches a new one, a message should be received with the new token on the user\'s me channel';
	}

	waitForSubscribe (callback) {
		const wait = this.setV3TokenTTL * 60 * 1000 + 1;
		setTimeout(callback, wait);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser.user.id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/bcast-token',
				token: this.currentUser.accessToken
			},
			callback
		);
	}

	validateMessage (message) {
		Assert(typeof message.message.setBroadcasterV3Token === 'string');
		return true;
	}
}

module.exports = RefreshExpiredTokenMessageTest;
