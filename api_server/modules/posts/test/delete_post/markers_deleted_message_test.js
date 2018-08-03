'use strict';

const MessageToTeamTest = require('./message_to_team_test');

class MarkersDeletedMessageTest extends MessageToTeamTest {

	constructor (options) {
		super(options);
		this.wantCodeBlocks = 5;
	}

	get description () {
		return 'members of the team should receive a message with the deactivated post and deactivated markers when a post with code blocks is deleted';
	}

}

module.exports = MarkersDeletedMessageTest;
