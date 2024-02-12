'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class ChangeNameMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team should receive a message with the changes to a user a when name change is discovered through IDP';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.delayLogin = true;
		this.init(async error => {
			if (error) { return callback(error); }
			// here we wait for the token refresh that occurs after initial user signup,
			// because that bumps the user version and we want the user version to match
			await new Promise(r => { setTimeout(r, 600); });
			callback();
		});
	}

	// set mock data to use during the test
	makeMockData (callback) {
		this.data = {
			name: this.userFactory.randomFullName()
		};
		const expectedVersion = 6;
		this.message = {
			user: {
				id: this.currentUser.user.id,
				$set: {
					fullName: this.data.name,
					modifiedAt: Date.now(), //placeholder
					version: expectedVersion
				},
				$version: {
					before: expectedVersion - 1,
					after: expectedVersion
				}
			}
		};
		super.makeMockData(callback);
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
		this.doLogin(callback);
	}

	validateMessage (message) {
		Assert(message.message.user.$set.modifiedAt >= this.testRunAt, 'modifiedAt not greater than or equal to when the test was run');
		this.message.user.$set.modifiedAt = message.message.user.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = ChangeNameMessageTest;
