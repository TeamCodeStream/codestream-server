'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const MessageTest = require('./message_test');
const RemoveReviewerTest = require('./add_reviewer_test');

class RemoveReviewerMessageTest extends Aggregation(MessageTest, RemoveReviewerTest) {

	get description () {
		const type = this.streamType || 'team';
		return `members of the stream or team should receive a message with the review when a reviewer is removed from a ${type} stream`;
	}
}

module.exports = RemoveReviewerMessageTest;
