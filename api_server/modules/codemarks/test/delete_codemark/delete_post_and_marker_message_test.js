'use strict';

const MessageTest = require('./message_test');
const DeletePostAndMarkerTest = require('./delete_post_and_marker_test');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class DeletePostAndMarkerMessageTest extends Aggregation(MessageTest, DeletePostAndMarkerTest) {

	get description () {
		return `members of the stream or team should receive a message with the deactivated codemark plus post and markers when a codemark with an attached post and markers is deleted in a ${this.streamType} stream`;
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

module.exports = DeletePostAndMarkerMessageTest;
