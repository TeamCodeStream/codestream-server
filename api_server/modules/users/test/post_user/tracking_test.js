'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CommonInit = require('./common_init');
const Assert = require('assert');

class TrackingTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'should send a Team Member Invited event for tracking purposes when a user is invited';
	}

	// make the data the will be used when issuing the request that triggers the message
	makeData (callback) {
		this.init(callback);
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user originating the request, we use their me-channel
		// we'll be sending the data that we would otherwise send to the tracker
		// service (mixpanel) on this channel, and then we'll validate the data
		this.channelName = `user-${this.currentUser.user._id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// initiate the request, this should trigger a publish of the tracker message
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: this.data,
				testTracking: true,
				reallyTrack: true,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.createdUser = response.user;
				callback();
			}
		);
	}

	/* eslint complexity: 0 */
	// validate the message received from pubnub
	validateMessage (message) {
		message = message.message;
		if (message.type !== 'track') {
			return false;
		}
		const data = message.data;
		const registered = !!this.existingUserIsRegistered;
		const firstInvite = !this.subsequentInvite;
		const provider = this.expectedProvider || 'CodeStream';
		const errors = [];
		const result = (
			((message.event === 'Team Member Invited') || errors.push('event not correct')) &&
			((data.distinct_id === this.currentUser.user._id) || errors.push('distinct_id not set to request originator\'s ID')) &&
			((data['Invitee Email Address'] === this.createdUser.email) || errors.push('Email Address does not match request originator')) &&
			((data['First Invite'] === firstInvite) || errors.push('First Invite not correct')) &&
			((data['Email Address'] === this.currentUser.user.email) || errors.push('Email Address not correct')) && 
			((data['Registered'] === registered) || errors.push('Registered not correct')) &&
			((data['Join Method'] === 'Created Team') || errors.push('Join Method not correct')) && 
			((data['Team ID'] === this.team._id) || errors.push('Team ID not correct')) &&
			((data['Team Size'] === this.team.memberIds.length + 1) || errors.push('Team Size not correct')) &&
			((data['Team Name'] === this.team.name) || errors.push('Team Name not correct')) &&
			((data['Provider'] === provider) || errors.push(`Provider not set to ${provider}`)) && 
			((data['Company'] === this.company.name) || errors.push('incorrect company name')) &&
			((data['Endpoint'] === 'Unknown IDE') || errors.push('IDE should be unknown')) &&
			((data['Plugin Version'] === '') || errors.push('Plugin Version should be blank')) &&
			((data['Plan'] === 'Free') || errors.push('Plan should be Free')) &&
			((data['Date Signed Up'] === new Date(this.currentUser.user.registeredAt).toISOString()) || errors.push('Date Signed Up not correct')) &&
			((data['Reporting Group'] === '') || errors.push('Reporting Group should be empty string'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		return true;
	}
}

module.exports = TrackingTest;
