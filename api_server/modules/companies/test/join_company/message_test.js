'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class MessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'a user who has joined a company should get a message on their me-channel that they have joined'
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// expect on the user's me-channel channel
		this.channelName = `user-${this.users[0].user.id}`;

		/*
		// for channels and directs the message comes on the stream channel
		if (this.stream.type === 'file' || this.stream.isTeamStream) {
			this.channelName = `team-${this.team.id}`;
		}
		else {
			throw 'stream channels are deprecated';
			//this.channelName = `stream-${this.stream.id}`;
		}
		*/
		
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the join, which will trigger the message
		this.doJoin(callback);
	}

	validateMessage (message) {
		// not going to concern ourselves with the precise content of the users,
		// just going to confirm they're sent (by id)
		const sentUserIds = message.message.users.map(u => u.id).sort((a, b) => {
			return a.localeCompare(b);
		});
		const expectedUserIds = this.users.map(u => u.user.id).sort((a, b) => {
			return a.localeCompare(b);
		});
		Assert.deepStrictEqual(sentUserIds, expectedUserIds, 'expected array of users was not sent');
		this.message.users = message.message.users;
		return super.validateMessage(message);
	}
}

module.exports = MessageTest;
