'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CommonInit = require('../common_init');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const Assert = require('assert');

class ReplyNoMessageToTeamStreamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'when a reply to a code error is posted, users should NOT receive a message on the team channel for the team of the user that originated the reply';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set options for the test
	setTestOptions (callback) {
		// create an initial code error to reply to
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 0,
				wantCodeError: true
			});
			callback();
		});
	}

	// make the data to be used for the test request
	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.data.streamId = this.postData[0].codeError.streamId;
			this.data.parentPostId = this.postData[0].post.id;
			delete this.data.codeError;
			callback();
		});
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

module.exports = ReplyNoMessageToTeamStreamTest;
