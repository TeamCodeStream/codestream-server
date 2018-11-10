'use strict';

const MessageTest = require('./message_test');

class ProviderTypeMessageTest extends MessageTest {

	constructor (options) {
		super(options);
		this.goPostless = true;
		this.updatePostId = true;
	}

	get description () {
		return `members of the team should receive a message with the codemark when a codemark is updated in a ${this.streamType} stream, and third-party streams are being used`;
	}
}

module.exports = ProviderTypeMessageTest;
