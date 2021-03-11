'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const MessageTest = require('./message_test');
const RemoveTagTest = require('./add_tag_test');

class RemoveTagMessageTest extends Aggregation(MessageTest, RemoveTagTest) {

	get description () {
		const type = this.streamType || 'team';
		return `members of the stream or team should receive a message with the review when a tag is removed from a ${type} stream`;
	}
}

module.exports = RemoveTagMessageTest;
