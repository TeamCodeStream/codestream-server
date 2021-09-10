'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class MessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'when a user joins a company, other members of the team should get a message that the user has been added';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		// don't try to listen as the user who is joining, listen as the team creator
		this.listeningUser = 1;
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// expect on the user's me-channel channel
		this.channelName = `team-${this.team.id}`;

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
		Assert(message.message.team.$set.modifiedAt >= this.modifiedAfter, 'team modifiedAt is not greater than or equal to when the user joined');
		this.message = {
			users: [this.currentUser.user],
			team: {
				id: this.team.id,
				_id: this.team.id,
				$set: {
					modifiedAt: message.message.team.$set.modifiedAt,
					version: 3
				},
				$addToSet: {
					memberIds: [ this.currentUser.user.id ]
				},
				$pull: {
					removedMemberIds: [ this.currentUser.user.id ]
				},
				$version: {
					before: 2,
					after: 3
				}
			}
		};
		delete this.message.users[0].preferences;
		return super.validateMessage(message);
	}
}

module.exports = MessageToTeamTest;
