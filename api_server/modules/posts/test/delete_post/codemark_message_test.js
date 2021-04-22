'use strict';

const MessageTest = require('./message_test');
const DeleteCodemarkTest = require('./delete_codemark_test');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');

class CodemarkMessageTest extends Aggregation(MessageTest, DeleteCodemarkTest) {

	get description () {
		const type = this.streamType || 'team';
		return `members of the team or stream should receive a message with the deactivated post and codemark when a post with a codemark is deleted in a ${type} stream`;
	}
}

module.exports = CodemarkMessageTest;
