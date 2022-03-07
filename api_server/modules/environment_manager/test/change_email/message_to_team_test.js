'use strict';

const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const Assert = require('assert');

class MessageToTeamTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'team members should receive a message indicating a user has a changed email when a cross-environment request is made to change a user\'s email';
	}

	// set the name of the channel we'll listen on for the test message
	setChannelName (callback) {
		// the team channel gets the message that a new user has confirmed registration
		this.channelName = 'team-' + this.team.id;
		callback();
	}

	// generate the test message
	generateMessage (callback) {
		const toEmail = this.userFactory.randomEmail();
		this.message = {
			users: [{
				_id: this.users[1].user.id, // DEPRECATE ME
				id: this.users[1].user.id,
				$set: {
					email: toEmail,
					searchableEmail: toEmail.toLowerCase(),
					modifiedAt: Date.now(), // placeholder
					version: 6
				},
				$version: {
					before: 5,
					after: 6
				}
			}]
		};
		this.emailChangedAt = Date.now();
		this.doApiRequest(
			{
				method: 'put',
				path: '/xenv/change-email',
				data: {
					email: this.users[1].user.email,
					toEmail
				},
				requestOptions: {
					headers: {
						'X-CS-Auth-Secret': this.apiConfig.sharedSecrets.auth
					}
				}
			},
			callback
		);
	}

	// validate the message received
	validateMessage (message) {
		const user = message.message.users[0];
		Assert(typeof user.$set.modifiedAt === 'number' && user.$set.modifiedAt >= this.emailChangedAt, 'modifiedAt not updated properly');
		this.message.users[0].$set.modifiedAt = user.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = MessageToTeamTest;
