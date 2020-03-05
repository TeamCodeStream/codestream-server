'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const MessageTest = require('./message_test');
const RemoveTagTest = require('./add_tag_test');

class RemoveTagMessageTest extends Aggregation(MessageTest, RemoveTagTest) {

	get description () {
		return `members of the stream or team should receive a message with the review when a tag is removed from a ${this.streamType} stream`;
	}
}

module.exports = RemoveTagMessageTest;
