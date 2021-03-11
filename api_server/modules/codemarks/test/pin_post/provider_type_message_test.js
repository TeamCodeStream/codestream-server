'use strict';

const MessageTest = require('./message_test');

class ProviderTypeMessageTest extends MessageTest {

	constructor (options) {
		super(options);
		this.goPostless = true;
	}

	get description () {
		const type = this.streamType || 'team';
		return `members of the team should receive a message with the codemark when a post is pinned to a codemark in a ${type} stream, and third-party streams are being used`;
	}
}

module.exports = ProviderTypeMessageTest;
