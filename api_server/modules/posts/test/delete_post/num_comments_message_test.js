'use strict';

const MessageToTeamTest = require('./message_to_team_test');

class NumCommentsMessageTest extends MessageToTeamTest {

	constructor (options) {
		super(options);
		this.wantParentPost = true;
	}

	get description () {
		return 'members of the team should receive a message with the numComments field decremented for the deletion of a reply to a post with a code block';
	}

}

module.exports = NumCommentsMessageTest;
