'use strict';

const MessageTest = require('./message_test');
const DeleteReviewMarkersTest = require('./delete_review_markers_test');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');

class ReviewMarkersMessageTest extends Aggregation(MessageTest, DeleteReviewMarkersTest) {

	get description () {
		return `members of the team should receive a message with the deactivated markers when a post with a review and markers is deleted in a ${this.streamType} stream`;
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

module.exports = ReviewMarkersMessageTest;
