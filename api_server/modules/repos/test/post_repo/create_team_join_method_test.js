'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');

class CreateTeamJoinMethodTest extends CodeStreamMessageTest {

	get description () {
		return 'when a user creates their first team by posting a repo, they should get a message indicating their join method as "Created Team"';
	}

	// set the name of the channel on which to listen for messages
	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}

	// issue the request that will generate the message we want to listen for
	generateMessage (callback) {
		// this is the message we expect to see
		this.message = {
			user: {
				_id: this.currentUser._id,
				$set: {
					joinMethod: 'Created Team'
				}
			}
		};
		// create a repo which will create a team, this should trigger a message
		// to the user that their "joinMethod" attribute has been set
		this.repoFactory.createRandomRepo(
			callback,
			{
				token: this.token
			}
		);
	}

	// validate the incoming message
	validateMessage (message) {
		let subMessage = message.message;
		// ignore any other message, we're looking for an update to our own user object
		if (!subMessage.user) {
			return false;
		}
		return super.validateMessage(message);
	}
}

module.exports = CreateTeamJoinMethodTest;
