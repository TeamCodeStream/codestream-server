'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class DeactivateUserMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team should receive a message with the deactivated user a user deactivation is discovered through IDP';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.delayLogin = true;
		this.init(callback);
	}

	// set mock data to use during the test
	makeMockData (callback) {
		super.makeMockData(error => {
			if (error) { return callback(error); }
			this.mockHeaders['X-CS-NR-Mock-Deleted-User'] = true; 
			const expectedVersion = 6;
			this.message = {
				user: {
					id: this.currentUser.user.id,
					$set: {
						deactivated: true,
						modifiedAt: Date.now(), //placeholder
						email: this.currentUser.user.email,
						version: expectedVersion
					},
					$version: {
						before: expectedVersion - 1,
						after: expectedVersion
					}
				}
			};
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.testRunAt = Date.now();
		this.delayLogin = false;
		this.doLogin(error => {
			Assert(error, 'error was not returned to login request');
			callback();
		});
	}

	validateMessage (message) {
		Assert(message.message.user.$set.modifiedAt >= this.testRunAt, 'modifiedAt not greater than or equal to when the test was run');
		this.message.user.$set.modifiedAt = message.message.user.$set.modifiedAt;
		const emailParts = this.currentUser.user.email.split('@');
		const emailRegExp = new RegExp(`${emailParts[0]}-deactivated[0-9]+@${emailParts[1]}`);
		Assert(message.message.user.$set.email.match(emailRegExp), 'email representing deactivated user not in correct format');
		this.message.user.$set.email = message.message.user.$set.email;
		return super.validateMessage(message);
	}
}

module.exports = DeactivateUserMessageTest;
