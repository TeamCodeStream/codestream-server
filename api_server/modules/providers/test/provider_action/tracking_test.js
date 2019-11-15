'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class TrackingTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return `should send a tracking message when a user initiates a ${this.provider} action, linkType=${this.linkType}`;
	}

	// before the test runs...
	makeData (callback) {
		this.init(callback);
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user originating the request, we use their me-channel
		// we'll be sending the data that we would otherwise send to the tracker
		// service on this channel, and then we'll validate the data
		this.channelName = `user-${this.user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// initiate the request, this should trigger a publish of the tracker message
		const path = `/no-auth/provider-action/${this.provider}`;
		this.doApiRequest(
			{
				method: 'post',
				path,
				data: this.data,
				testTracking: true,
				reallyTrack: true,
				trackOnChannel: `user-${this.user.id}`,
				requestOptions: {
					headers: this.apiRequestOptions.headers,
					noJsonInRequest: true
				}
			},
			callback
		);
	}
}

module.exports = TrackingTest;
