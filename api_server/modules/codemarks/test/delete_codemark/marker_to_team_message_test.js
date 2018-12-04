'use strict';

const MessageTest = require('./message_test');
const DeletePostAndMarkerTest = require('./delete_post_and_marker_test');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class MarkerToTeamMessageTest extends Aggregation(MessageTest, DeletePostAndMarkerTest) {

	get description () {
		return `members of the team should receive a message with the deactivated marker when a codemark with markers is deleted in a ${this.streamType} stream`;
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// postless markers always come in on the team channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	deleteCodemark (callback) {
		super.deleteCodemark(error => {
			if (error) { return callback(error); }
			// the message received on the team channel should be limited to the markers 
			this.message = {
				markers: this.message.markers
			};
			callback();
		});
	}
}

module.exports = MarkerToTeamMessageTest;
