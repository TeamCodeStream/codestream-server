'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const MessageToTeamTest = require('./message_to_team_test');
const AddUserTest = require('./add_user_test');

class AddUserMessageToTeamTest extends Aggregation(MessageToTeamTest, AddUserTest) {

	get description () {
		return 'members of the team should receive a message with the stream when a user is added to a public stream';
	}
}

module.exports = AddUserMessageToTeamTest;
