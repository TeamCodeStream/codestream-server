'use strict';

const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');

class MessageToUserTest extends CodeStreamMessageTest {

	get description () {
		return 'when a user logs out of a session, registered users with matching emails should get a message with updated eligible join companies';
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// expect on the user's me-channel 
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the logout, which will trigger the message
		this.doApiRequest(
			{
				method: 'put',
				path: '/logout',
				token: this.token
			},
			callback
		);
	}

	validateMessage (message) {
		// the user should have no more eligible companies to join
		this.message = {
			user: {
				id: this.currentUser.user.id,
				$set: {
					eligibleJoinCompanies: []
				},
				$version: {
					before: '*'
				}
			}
		};
		return super.validateMessage(message);
	}
}

module.exports = MessageToUserTest;
