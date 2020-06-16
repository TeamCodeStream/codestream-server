'use strict';

const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const Assert = require('assert');

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
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// issue the request that will generate the message we want to listen for
	generateMessage (callback) {
		// create a new team, this should trigger a message
		// to the user that their "joinMethod" attribute has been set
		this.updatedAt = Date.now();
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				// this is the message we expect to see
				this.message = {
					user: {
						_id: this.currentUser.user.id,	// DEPRECATE ME
						id: this.currentUser.user.id,
						$set: {
							joinMethod: 'Created Team',
							primaryReferral: 'external',
							originTeamId: response.team.id,
							version: 3
						},
						$addToSet: {
							teamIds: response.team.id,
							companyIds: response.company.id
						},
						$unset: {
							companyName: true
						},
						$version: {
							before: 2,
							after: 3
						}
					},
					team: response.team,
					company: response.company
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
		Assert(subMessage.user.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		this.message.user.$set.modifiedAt = subMessage.user.$set.modifiedAt;
		// ignore any other message, we're looking for an update to our own user object
		if (!subMessage.user) {
			return false;
		}
		return super.validateMessage(message);
	}
}

module.exports = MessageToUserTest;
