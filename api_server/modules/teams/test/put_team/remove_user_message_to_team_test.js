'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class RemoveUserMessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'when a user is removed from a team, members of the team should get a message from the team indicating the users have been removed from the team';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// form the data for the team update
	makeTeamData (callback) {
		// remove current user from the team, that user will then try to subscribe
		super.makeTeamData(() => {
			this.data.$addToSet = {
				removedMemberIds: this.currentUser.user.id
			};
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request to update the team
	generateMessage (callback) {
		this.otherUserUpdatesTeam = true;
		this.updatedAt = Date.now();
		this.updateTeam(error => {
			if (error) { return callback(error); }
			this.message = this.updateTeamResponse;
			callback();
		});
	}

	waitForSubscribe (callback) {
		this.testLog(`Waiting 500ms for subscribe...`);
		setTimeout(callback, 500);
	}

	validateMessage (message) {
		Assert(message.message.team.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		this.message.team.$set.modifiedAt = message.message.team.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = RemoveUserMessageToTeamTest;
