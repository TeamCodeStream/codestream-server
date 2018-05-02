'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const MessageToTeamTest = require('./message_to_team_test');
const RemoveUserTest = require('./remove_user_test');

class RemoveUserMessageToTeamTest extends Aggregation(MessageToTeamTest, RemoveUserTest) {

	get description () {
		return 'members of the team should receive a message with the stream when a user is removed from a public stream';
	}
}

module.exports = RemoveUserMessageToTeamTest;
