'use strict';

const MessageTest = require('./message_test');
const DeletePostAndMarkerTest = require('./delete_post_and_marker_test');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class DeletePostMarkerMessageTest extends Aggregation(MessageTest, DeletePostAndMarkerTest) {

	constructor (options) {
		super(options);
		this.wantPost = true;
		this.wantMarker = true;
	}

	get description () {
		return `members of the stream or team should receive a message with the deactivated codemark when a codemark is deleted in a ${this.streamType} stream`;
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		if (this.streamType === 'team stream') {
			this.channelName = `team-${this.team.id}`;
		}
		else {
			this.channelName = `stream-${this.stream.id}`;
		}
		callback();
	}
}

module.exports = DeletePostMarkerMessageTest;
