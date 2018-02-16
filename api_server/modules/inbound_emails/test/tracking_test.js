'use strict';

var InboundEmailMessageTest = require('./inbound_email_message_test');
const Assert = require('assert');

class TrackingTest extends InboundEmailMessageTest {

	get description () {
		return 'should send a Post Created event for tracking purposes when handling a post via email';
	}

	// make the data the will be used when issuing the request that triggers the message
	makeData (callback) {
		// perform a little trickery here ... set the current user to the originator of the post,
		// since the mock tracking message will come back on the originator's me-channel
		super.makeData(() => {
			this.currentUser = this.postOriginatorData.user;
			this.token = this.postOriginatorData.accessToken;
			callback();
		});
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user that is being tracked as the post creator, we use their me-channel
		// we'll be sending the data that we would otherwise send to the tracker
		// service (mixpanel) on this channel, and then we'll validate the data
		this.channelName = `user-${this.postOriginatorData.user._id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// simulate an inbound email by calling the API server's inbound-email
		// call with post data, this should trigger post creation and a publish
		// of the tracker message
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/inbound-email',
				data: this.data,
				testTracking: true,
				reallyTrack: true
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				callback();
			}
		);
	}

	// validate the message received from pubnub
	validateMessage (message) {
		message = message.message;
		let data = message.data;
		let errors = [];
		let result = (
			((message.type === 'track') || errors.push('type not correct')) && 
			((message.event === 'Post Created') || errors.push('event not correct')) &&
			((data.distinct_id === this.postOriginatorData.user._id) || errors.push('distinct_id not set to post originator\'s ID')) &&
			((data.Type === 'Chat') || errors.push('Type not correct')) &&
			((data.Thread === 'Parent') || errors.push('Thread not correct')) &&
			((data.Category === 'Source File') || errors.push('Category not correct')) &&
			((data['Email Address'] === this.postOriginatorData.user.email) || errors.push('Email Address does not match post originator')) &&
			((data['Join Method'] === this.postOriginatorData.user.joinMethod) || errors.push('Join Method does not match post originator')) &&
			((data['Team ID'] === this.team._id) || errors.push('Team ID does not match team')) &&
			((data['Team Size'] === this.team.memberIds.length) || errors.push('Team Size does not match number of members in team')) &&
			((data.Endpoint === 'Email') || errors.push('Endpoint not correct')) &&
			((data.Plan === 'Free') || errors.push('Plan not correct')) &&
			((data['Date of Last Post'] === new Date(this.post.createdAt).toISOString()) || errors.push('Date of Last Post not correct')) &&
			((data['Date Signed Up'] === new Date(this.postOriginatorData.user.registeredAt).toISOString()) || errors.push('Date Signed Up not correct'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		return true;
	}
}

module.exports = TrackingTest;
