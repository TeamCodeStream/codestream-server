'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class MessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team that owns a code error should receive a message with the update when an update is made to a reply to a code error through the New Relic comment engine';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	init (callback) {
		BoundAsync.series(this, [
			super.init,
			this.claimCodeError
		], callback);
	}
	
	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// when posted to a team stream, it is the team channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.updateNRComment(callback);
	}

	validateMessage (message) {
		Assert(message.message.post.$set.modifiedAt >= this.updatedAfter, 'modifiedAt not updated in message');
		this.message.post.$set.modifiedAt = message.message.post.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = MessageTest;
