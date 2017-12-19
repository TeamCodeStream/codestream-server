'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var RandomString = require('randomstring');
var User = require(process.env.CS_API_TOP + '/services/api/modules/users/user');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');

class UserMessageToOtherUserTest extends CodeStreamMessageTest {

	get description () {
		return 'team members should receive a user message when a user registers, if they are already on a team';
	}

	makeData (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRepo
		], callback);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.otherUserData = response;
				callback();
			}
		);
	}

	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				withEmails: [this.currentUser.email],
				withRandomEmails: 1,
				token: this.otherUserData.accessToken
			}
		);
	}

	setChannelName (callback) {
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	generateMessage (callback) {
		this.registeringUser = this.users[1];
		Object.assign(this.registeringUser, {
			username: RandomString.generate(12),
			firstName: RandomString.generate(12),
			lastName: RandomString.generate(12)
		});
		let user = new User(this.registeringUser);
		let userObject = user.getSanitizedObject();
		this.message = {
			users: [userObject]
		};
		Object.assign(this.registeringUser, {
			password: RandomString.generate(12),
			_confirmationCheat: SecretsConfig.confirmationCheat,	// gives us the confirmation code in the response
			_forceConfirmation: true								// this forces confirmation even if not enforced in environment
		});
		this.userFactory.registerUser(this.registeringUser, callback);
	}

	messageReceived (error, message) {
		if (message && message.message && message.message.users && message.message.users[0]) {
			// no way of knowing what this will be, so just set it to what we receive before we compare
			this.message.users[0].modifiedAt = message.message.users[0].modifiedAt;
		}
		super.messageReceived(error, message);
	}
}

module.exports = UserMessageToOtherUserTest;
