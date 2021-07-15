'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const MessageTest = require('./message_test');
const AddAssigneeTest = require('./add_assignee_test');

class AddAssigneeMessageTest extends Aggregation(MessageTest, AddAssigneeTest) {

	get description () {
		const type = this.streamType || 'team';
		return `members of the stream or team should receive a message with the code error when an assignee is added to a code error in a ${type} stream`;
	}
}

module.exports = AddAssigneeMessageTest;
