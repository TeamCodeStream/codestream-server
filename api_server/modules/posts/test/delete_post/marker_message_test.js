'use strict';

const MessageTest = require('./message_test');
const DeleteMarkerTest = require('./delete_marker_test');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class MarkerMessageTest extends Aggregation(MessageTest, DeleteMarkerTest) {

	get description () {
		return `members of the team should receive a message with the deactivated markers when a post with a codemark and markers is deleted in a ${this.streamType} stream`;
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// markers always come in on the team channel
		this.channelName = `team-${this.team._id}`;
		callback();
	}

	deletePost (callback) {
		super.deletePost(error => {
			if (error) { return callback(error); }
			// only the markers come on the team channel
			this.message = {
				markers: this.message.markers
			};
			callback();
		});
	}
}

module.exports = MarkerMessageTest;
