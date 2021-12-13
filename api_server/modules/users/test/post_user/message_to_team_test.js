'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class MessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team should receive a message with the user when a user is added to the team';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the team channel
		this.channelName = 'team-' + this.team.id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the
		// team channel with the updated post
		this.updatedAt = Date.now();
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				this.message.users = [response.user];
				this.message.team = {
					_id: this.team.id,	// DEPRECATE ME
					id: this.team.id,
					$addToSet: {
						memberIds: [response.user.id]
					},
					$pull: {
						removedMemberIds: [response.user.id],
						foreignMemberIds: [response.user.id]
					},
					$set: {
						version: 7
					},
					$version: {
						before: 6,
						after: 7
					}
				};
				delete this.message.user;
				callback();
			}
		);
	}

	validateMessage (message) {
		Assert(message.message.team.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		this.message.team.$set.modifiedAt = message.message.team.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = MessageToTeamTest;
