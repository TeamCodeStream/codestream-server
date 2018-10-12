'use strict';

const HasRepliesMessageToTeamStreamTest = require('./has_replies_message_to_team_stream_test');

class NumRepliesMessageToTeamStreamTest extends HasRepliesMessageToTeamStreamTest {
	
	constructor (options) {
		super(options);
		this.wantFirstReply = true;
	}

	get description () {
		return 'members of a team stream should receive a message with the parent post and numReplies set to 2 when the second reply is created to the post';
	}
}

module.exports = NumRepliesMessageToTeamStreamTest;