'use strict';

const MessageToAuthorTest = require('./message_to_author_test');
const Assert = require('assert');

class SetPersonAnalyticsTest extends MessageToAuthorTest {

	get description () {
		return 'when a new post is created, MixPanel should be updated with the total post count and last post created at for the author of the post';
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// create the post with testing of tracking on, to receive the mock message back that
		// would otherwise go to MixPanel
		const data = {
			streamId: this.stream._id,
			text: this.postFactory.randomText()
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: data,
				token: this.users[1].accessToken,	// the "post creator" creates the post
				testTracking: true,
				reallyTrack: true
			},
			callback
		);
	}


	// validate the message received from pubnub
	validateMessage (message) {
		message = message.message;
		if (!message.event) {
			return false;
		}
		const data = message.data;
		const errors = [];
		const result = (
			((message.type === 'setPerson') || errors.push('type not correct')) &&
			((message.event === this.users[1].user._id) || errors.push('event should be the user ID')) &&
			((data['Total Posts'] === 1) || errors.push('Total Posts should be 1'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		const lastPostCreatedAt = Date.parse(data['Date of Last Post']);
		Assert(typeof lastPostCreatedAt === 'number' && lastPostCreatedAt > this.timeBeforePost, 'lastPostCreatedAt is not set or not greater than the time before the post');
		return true;
	}
}

module.exports = SetPersonAnalyticsTest;
