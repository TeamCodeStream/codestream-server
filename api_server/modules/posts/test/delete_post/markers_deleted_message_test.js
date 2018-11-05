'use strict';

const MessageTest = require('./message_test');

class MarkersDeletedMessageTest extends MessageTest {

	get description () {
		return 'members of the team should receive a message with the deactivated post and deactivated markers when a post with markers is deleted';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.wantMarker = true;
			callback();
		});
	}
}

module.exports = MarkersDeletedMessageTest;
