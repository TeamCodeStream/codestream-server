'use strict';

const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const Assert = require('assert');
const User = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user');

class MessageToTeamTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			numAdditionalInvites: 1
		});
	}

	get description () {
		return 'team members should receive a message indicating a user is registered when a cross-environment request is made to confirm registration';
	}

	// set the name of the channel we'll listen on for the test message
	setChannelName (callback) {
		// the team channel gets the message that a new user has confirmed registration
		this.channelName = 'team-' + this.team.id;
		callback();
	}

	// generate the test message
	generateMessage (callback) {
		// the message we expect to receive is the registered user, with isRegistered flag set
		let user = this.users.find(user => {
			return !user.user.isRegistered && (user.user.teamIds || []).includes(this.team.id);
		});
		user = new User(user.user);
		let userObject = user.getSanitizedObject();
		Object.assign(userObject, {
			isRegistered: true,
			joinMethod: 'Added to Team',
			primaryReferral: 'internal',
			originTeamId: this.team.id,
			version: 2
		});
		delete userObject.inviteCode;
		this.message = {
			users: [userObject]
		};
		this.beforeConfirmTime = Date.now();

		this.doApiRequest(
			{
				method: 'post',
				path: '/xenv/confirm-user',
				data: {
					email: userObject.email
				},
				requestOptions: {
					headers: {
						'X-CS-Auth-Secret': this.apiConfig.environmentGroupSecrets.requestAuth
					}
				}
			},
			callback
		);
	}

	// validate the message received
	validateMessage (message) {
		// we can't predict these in advance, just check that they were updated
		// and then add them to our comparison message for validation
		const user = message.message.users[0];
		Assert(typeof user.modifiedAt === 'number' && user.modifiedAt >= this.beforeConfirmTime, 'modifiedAt not updated properly');
		Assert(typeof user.registeredAt === 'number' && user.registeredAt >= this.beforeConfirmTime, 'registeredAt not updated properly');
		this.message.users[0].modifiedAt = user.modifiedAt;
		this.message.users[0].registeredAt = user.registeredAt;
		return super.validateMessage(message);
	}
}

module.exports = MessageToTeamTest;
