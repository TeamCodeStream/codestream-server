'use strict';

const HasRepliesMessageToTeamTest = require('./has_replies_message_to_team_test');

class NumRepliesMessageToTeamTest extends HasRepliesMessageToTeamTest {
	
	constructor (options) {
		super(options);
		this.wantFirstReply = true;
	}

	get description () {
		return 'members of the team should receive a message with the parent post and numReplies set to 2 when the second reply is created to the post in a file stream';
	}
}

module.exports = NumRepliesMessageToTeamTest;