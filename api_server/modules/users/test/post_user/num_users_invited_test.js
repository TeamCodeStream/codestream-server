'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class NumUsersInvitedTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'the inviting user should get numUsersInvited incremented when inviting a user to the team';
	}

	setOptions () {
		super.setOptions();
		this.teamOptions.creatorIndex = 1;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the team channel
		this.channelName = 'user-' + this.currentUser.user.id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the user channel 
		this.updatedAt = Date.now();
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: this.data,
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				this.message = {
					user: {
						_id: this.currentUser.user.id, // DEPRECATE ME
						id: this.currentUser.user.id,
						$set: {
							numUsersInvited: 1,
							version: 4,
							modifiedAt: Date.now() // placeholder
						},
						$version: {
							before: 3,
							after: 4
						}
					}
				};
				callback();
			}
		);
	}

	validateMessage (message) {
		Assert(message.message.user.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		this.message.user.$set.modifiedAt = message.message.user.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = NumUsersInvitedTest;
