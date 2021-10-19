'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CommonInit = require('../common_init');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class NoMessageToTeamStreamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'when a code error is created, a message with the post and code error should NOT be sent to the team channel';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// make the data to be sent in the request
	makePostData (callback) {
		BoundAsync.series(this, [
			super.makePostData,
			this.addCodeErrorData
		], callback);
	}

	// add code error data to the test request
	addCodeErrorData (callback) {
		this.data.codeError = this.codeErrorFactory.getRandomCodeErrorData();
		callback();
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.createPost(callback);
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error, message) {
		if (error) { return this.messageCallback(error); }
		Assert.fail('message was received');
	}
}

module.exports = NoMessageToTeamStreamTest;
