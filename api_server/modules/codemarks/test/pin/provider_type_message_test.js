'use strict';

const MessageTest = require('./message_test');

class ProviderTypeMessageTest extends MessageTest {

	constructor (options) {
		super(options);
		this.goPostless = true;
	}

	get description () {
		return `members of the team should receive a message with the codemark when a codemark is pinned in a ${this.streamType} stream, and third-party streams are being used`;
	}
}

module.exports = ProviderTypeMessageTest;
