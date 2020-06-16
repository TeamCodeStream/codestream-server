'use strict';

const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const User = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user');

class InvitedUserMessageToTeamTest extends CodeStreamMessageTest {

	get description () {
		return 'team members should receive a user message when a user who has been invited to a team registers with an invite code';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.inviteUser
		], callback);
	}

	// invite the user before registering ... since the user is registering with the same email
	// with which they were invited, and since they provide an invite code, we should skip confirmation
	// and just log them in
	inviteUser (callback) {
		const data = this.userFactory.getRandomUserData();
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					teamId: this.team.id,
					email: data.email,
					fullName: data.fullName,
					_pubnubUuid: data._pubnubUuid,
					_confirmationCheat: this.apiConfig.secrets.confirmationCheat
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.inviteCode = response.inviteCode;
				this.invitedUser = response.user;
				callback();
			}
		);
	}

	// set the channel name we expect to receive a message on
	setChannelName (callback) {
		// newly registered users should be seen on the team channel
		this.channelName = 'team-' + this.team.id;
		callback();
	}

	// issue the request that generates the message we expect to see
	generateMessage (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: {
					email: this.invitedUser.email,
					username: RandomString.generate(12),
					password: RandomString.generate(12),
					fullName: this.userFactory.randomFullName(),
					inviteCode: this.inviteCode
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				// we expect a "sanitized" version of this user in the response
				const user = new User(response.user).getSanitizedObject();
				user.version = 2;	// version number will be bumped when the user confirms
				this.message = { users: [user] };
				callback();
			}
		);
	}

	// validate the received message
	messageReceived (error, message) {
		if (message && message.message && message.message.users && message.message.users[0]) {
			// no way of knowing what this will be, so just set it to what we receive before we compare
			this.message.users[0].modifiedAt = message.message.users[0].modifiedAt;
		}
		super.messageReceived(error, message);
	}
}

module.exports = InvitedUserMessageToTeamTest;
