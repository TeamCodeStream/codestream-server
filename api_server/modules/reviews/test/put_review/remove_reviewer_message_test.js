'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const MessageTest = require('./message_test');
const RemoveReviewerTest = require('./add_reviewer_test');

class RemoveReviewerMessageTest extends Aggregation(MessageTest, RemoveReviewerTest) {

	get description () {
		return `members of the stream or team should receive a message with the review when a reviewer is removed from a ${this.streamType} stream`;
	}
}

module.exports = RemoveReviewerMessageTest;
