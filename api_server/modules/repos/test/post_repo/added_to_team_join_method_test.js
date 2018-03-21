'use strict';

var UsersJoinExistingTeamMessageTest = require('./users_join_existing_team_message_test');
var Assert = require('assert');

class AddedToTeamJoinMethodTest extends UsersJoinExistingTeamMessageTest {

	get description () {
		return 'when a registered user is added to a team, and it is their first, they should get a message indicating their join method as "Added to Team", and primary referral as "internal"';
	}

	validateMessage (message) {
		const currentUser = message.message.users.find(user => user._id === this.currentUser._id);
		const originTeamId = this.originTeam ? this.originTeam._id : this.team._id;
		Assert(currentUser.joinMethod === 'Added to Team', 'joinMethod not set to Added to Team');
		Assert(currentUser.primaryReferral === 'internal', 'primaryReferral not set to internal');
		Assert(currentUser.originTeamId === originTeamId, 'originTeamId is not set to the correct team');
		return super.validateMessage(message);
	}
}

module.exports = AddedToTeamJoinMethodTest;
