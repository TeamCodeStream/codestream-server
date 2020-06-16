'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');

class MessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		const type = this.streamType === 'team stream' ? 'team' : this.streamType;
		const on = this.streamType === 'team stream' ? 'team' : 'stream';
		return `members of the ${on} should receive a message with the deactivated codemark when a codemark is deleted from a ${type} stream`;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		if (this.streamType === 'team stream') {
			this.channelName = `team-${this.team.id}`;
		}
		else {
			this.channelName = `stream-${this.stream.id}`;
		}
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the delete, this should trigger a message to the team channel
		// with the deleted codemark
		this.deleteCodemark(callback);
	}
}

module.exports = MessageTest;
