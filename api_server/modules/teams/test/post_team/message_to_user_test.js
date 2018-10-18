'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');

class MessageToUserTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'when a user creates a team, they should get a message that they have been added to this team, as well as analytics updates';
	}

	// set the name of the channel on which to listen for messages
	setChannelName (callback) {
		this.channelName = `user-${this.currentUser.user._id}`;
		callback();
	}

	// issue the request that will generate the message we want to listen for
	generateMessage (callback) {
		// create a new team, this should trigger a message
		// to the user that their "joinMethod" attribute has been set
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				// this is the message we expect to see
				this.message = {
					user: {
						_id: this.currentUser.user._id,
						$set: {
							joinMethod: 'Created Team',
							primaryReferral: 'external',
							originTeamId: response.team._id,
							version: 3
						},
						$addToSet: {
							teamIds: response.team._id,
							companyIds: response.company._id
						},
						$version: {
							before: 2,
							after: 3
						}
					}
				};
				callback();
			},
			{
				token: this.token
			}
		);
	}

	// validate the incoming message
	validateMessage (message) {
		const subMessage = message.message;
		// ignore any other message, we're looking for an update to our own user object
		if (!subMessage.user) {
			return false;
		}
		return super.validateMessage(message);
	}
}

module.exports = MessageToUserTest;
