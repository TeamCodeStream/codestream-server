'use strict';

var MessageToAuthorTest = require('./message_to_author_test');
var Assert = require('assert');

class SetPersonAnalyticsTest extends MessageToAuthorTest {

	get description () {
		return 'when a new post is created, MixPanel should be updated with the total post count and last post created at for the author of the post';
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// create the post with testing of tracking on, to receive the mock message back that
		// would otherwise go to MixPanel
		let data = {
			streamId: this.stream._id,
			text: this.postFactory.randomText()
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: data,
				token: this.postCreatorData.accessToken,	// the "post creator" creates the post
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
		let data = message.data;
		let errors = [];
		let result = (
			((message.type === 'setPerson') || errors.push('type not correct')) &&
			((message.event === this.postCreatorData.user._id) || errors.push('event should be the user ID')) &&
			((data['Total Posts'] === 1) || errors.push('Total Posts should be 1'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		let lastPostCreatedAt = Date.parse(data['Date of Last Post']);
		Assert(typeof lastPostCreatedAt === 'number' && lastPostCreatedAt > this.timeBeforePost, 'lastPostCreatedAt is not set or not greater than the time before the post');
		return true;
	}
}

module.exports = SetPersonAnalyticsTest;
