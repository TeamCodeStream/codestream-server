'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class MessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'when a user declines an invite from a company, other members of the team should get a message that the user has been deleted';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		// don't try to listen as the user who is declining, listen as the team creator
		this.listeningUserIndex = 1;
		this.testBeganAt = Date.now();
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// expect on the user's me-channel channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the decline, which will trigger the message
		this.declineInvite(callback);
	}

	validateMessage (message) {
		const user = message.message.users[0];
		Assert(user.$set.modifiedAt >= this.declinedAfter, 'modifiedAt not set to after the invite declination');
		this.expectedData.user.$set.modifiedAt = user.$set.modifiedAt;

		const match = user.$set.email.match(/^.+-deactivated[0-9]+?@.+$/);
		Assert(match, 'user email not updated properly');
		this.expectedData.user.$set.email = user.$set.email;

		this.message = { users: [this.expectedData.user] };
		return super.validateMessage(message);
	}
}

module.exports = MessageToTeamTest;
