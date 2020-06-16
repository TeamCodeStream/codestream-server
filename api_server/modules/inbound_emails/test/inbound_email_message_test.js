'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');

class InboundEmailMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		const type = this.isTeamStream ? 'team' : this.type;
		return `should create and publish a post when an inbound email call is made in a ${type} stream`;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// team channel for file-type streams, or team-streams, otherwise the stream channel
		if (this.type === 'file' || this.isTeamStream) {
			this.channelName = `team-${this.team.id}`;
		}
		else {
			this.channelName = `stream-${this.stream.id}`;
		}
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// simulate an inbound email by calling the API server's inbound-email
		// call with post data, this should trigger post creation and a publish
		// of the post through the team channel
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/inbound-email',
				data: this.data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;	// we expect the same info through pubnub
				callback();
			}
		);
	}
}

module.exports = InboundEmailMessageTest;
