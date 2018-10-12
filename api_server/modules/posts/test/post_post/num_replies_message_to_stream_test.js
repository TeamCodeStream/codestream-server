'use strict';

const HasRepliesMessageToStreamTest = require('./has_replies_message_to_team_test');

class NumRepliesMessageToStreamTest extends HasRepliesMessageToStreamTest {
	
	constructor (options) {
		super(options);
		this.wantFirstReply = true;
	}

	get description () {
		return `members of a ${this.type} stream should receive a message with the parent post and numReplies set to 2 when the second reply is created to the post`;
	}
}

module.exports = NumRepliesMessageToStreamTest;