'use strict';

const MessageTest = require('./message_test');

class MarkerMessageTest extends MessageTest {

	constructor (options) {
		super(options);
		this.wantMarker = true;
	}

	get description () {
		return 'members of the team should receive a message with the deactivated codemark and markers when a codemark with markers is deleted in a third-party stream';
	}
}

module.exports = MarkerMessageTest;
