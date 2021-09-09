'use strict';

const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const Assert = require('assert');

class MessageToUserTest extends CodeStreamMessageTest {

	get description () {
		return 'when a user creates a company, they should get a message that they have been added to this company';
	}

	// set the name of the channel on which to listen for messages
	setChannelName (callback) {
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// issue the request that will generate the message we want to listen for
	generateMessage (callback) {
		// create a new cmpany, this should trigger a message to the user
		this.updatedAt = Date.now();
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				// this is the message we expect to see
				this.message = {
					user: {
						_id: this.currentUser.user.id,	// DEPRECATE ME
						id: this.currentUser.user.id,
						$set: {
							version: 6
						},
						$addToSet: {
							companyIds: response.company.id,
							teamIds: response.team.id
						},
						$unset: {
							companyName: true
						},
						$version: {
							before: 5,
							after: 6
						}
					},
					company: response.company,
					team: response.team
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
