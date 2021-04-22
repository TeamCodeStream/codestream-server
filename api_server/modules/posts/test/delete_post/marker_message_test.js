'use strict';

const MessageTest = require('./message_test');
const DeleteMarkerTest = require('./delete_marker_test');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');

class MarkerMessageTest extends Aggregation(MessageTest, DeleteMarkerTest) {

	get description () {
		const type = this.streamType || 'team';
		return `members of the team should receive a message with the deactivated markers when a post with a codemark and markers is deleted in a ${type} stream`;
	}

	/*
	None of these overrides are relevant when the post is in the team stream, which is all that's allowed right now
	
	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// markers always come in on the team channel
		this.channelName = `team-${this.team.id}`;
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
	*/
}

module.exports = MarkerMessageTest;
