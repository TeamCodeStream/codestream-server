'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');

class MessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		const whichChannel = this.isTeamStream ? 'team' : 'stream';
		const streamType = this.isTeamStream ? 'the team stream' : `a ${this.streamType} stream`;
		return `members of the ${whichChannel} should receive a message on the ${whichChannel} channel with the review when someone reopens a review in ${streamType}`;
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

	// generate the message by issuing a request to reopen the review
	generateMessage (callback) {
		this.reopenReview(callback);
	}
}

module.exports = MessageTest;
