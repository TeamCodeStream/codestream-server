'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');

class MessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		const type = this.streamType || 'team';
		return `members of the ${type} should receive a message with the deactivated code error when a code error is deleted from a ${type} stream`;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// since posting to streams other than the team stream is no longer allowed,
		// just listen on the team channel
		this.channelName = `team-${this.team.id}`;

		/*
		if (this.streamType === 'team stream') {
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
		// do the delete, this should trigger a message to the team channel
		// with the deleted code error
		this.deleteCodeError(callback);
	}
}

module.exports = MessageTest;
