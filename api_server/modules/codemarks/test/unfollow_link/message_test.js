'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class MessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		const whichChannel = this.isTeamStream ? 'team' : 'stream';
		const streamType = this.isTeamStream ? 'the team stream' : `a ${this.streamType} stream`;
		return `members of the ${whichChannel} should receive a message on the ${whichChannel} channel with the codemark when someone unfollows a codemark in ${streamType} by clicking an email link`;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = this.isTeamStream ? `team-${this.team.id}` : `stream-${this.stream.id}`;
		callback();
	}

	// generate the message by issuing a request to relate the codemarks
	generateMessage (callback) {
		this.unfollowCodemark(callback);
	}

	validateMessage (message) {
		Assert(message.message.codemark.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt set in codemark message not properly set');
		this.message.codemark.$set.modifiedAt = message.message.codemark.$set.modifiedAt;
		super.validateMessage(message);
		return true;
	}
}

module.exports = MessageTest;
