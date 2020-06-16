'use strict';

const MessageTest = require('./message_test');
const DeleteReviewTest = require('./delete_review_test');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');

class ReviewMessageTest extends Aggregation(MessageTest, DeleteReviewTest) {

	get description () {
		return `members of the team or stream should receive a message with the deactivated post and review when a post with a review is deleted in a ${this.streamType} stream`;
	}
}

module.exports = ReviewMessageTest;
