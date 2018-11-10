'use strict';

const ProviderTypeMessageTest = require('./provider_type_message_test');

class UpdateMarkerMessageTest extends ProviderTypeMessageTest {

	constructor (options) {
		super(options);
		this.wantMarker = true;
	}

	get description () {
		return `members of the team should receive a message with the codemark and the marker when a codemark with a marker is updated in a ${this.streamType} stream, and third-party streams are being used`;
	}
}

module.exports = UpdateMarkerMessageTest;
