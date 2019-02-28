'use strict';

const MessageTest = require('./message_test');

class DeauthHostMessageTest extends MessageTest {

	constructor (options) {
		super(options);
		this.includeHost = true;
	}

	get description () {
		return `user should receive a message to clear the token data after deauthorizing ${this.provider} against a specific host`;
	}
}

module.exports = DeauthHostMessageTest;
