'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CommonInit = require('../common_init');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');

class CodeErrorReplyMessageToObjectStreamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'followers of a code error should receive a message on the object stream for that code error when a reply is posted';
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
		this.channelName = `object-${this.postData[0].codeError.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.createPost(callback);
	}

	// validate the message received
	validateMessage (message) {
		// ignore the post update message ... this should probably not be published separately anyway, but TODO
		if (message.message.post && message.message.post.$set) { return false; }
		return super.validateMessage(message);
	}
}

module.exports = CodeErrorReplyMessageToObjectStreamTest;
