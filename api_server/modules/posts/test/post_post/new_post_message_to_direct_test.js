'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const PostToDirectTest = require('./post_to_direct_test');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');

class NewPostMessageToChannelTest extends Aggregation(CodeStreamMessageTest, CommonInit, PostToDirectTest) {

	get description () {
		return 'members of the stream should receive a message with the post when a post is posted to a direct stream';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// channels and DMs go to the stream channel
		this.channelName = `stream-${this.stream.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: this.data,
				token: this.useToken || this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				callback();
			}
		);
	}
}

module.exports = NewPostMessageToChannelTest;
