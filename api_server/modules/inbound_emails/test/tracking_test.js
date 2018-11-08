'use strict';

const InboundEmailMessageTest = require('./inbound_email_message_test');
const Assert = require('assert');

class TrackingTest extends InboundEmailMessageTest {

	get description () {
		const privacy = this.makePublic ? 'public ' : '';
		return `should send a Post Created event for tracking purposes when handling a post via email for a ${privacy}${this.type} stream`;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.creatorIndex = 0;
			this.repoOptions.creatorIndex = 0;
			callback();
		});
	}

	// make the data the will be used when issuing the request that triggers the message
	makeData (callback) {
		// perform a little trickery here ... set the current user to the originator of the post,
		// since the mock tracking message will come back on the originator's me-channel
		super.makeData(() => {
			this.users[1].user.joinMethod = 'Added to Team';
			this.currentUser = this.users[1];
			this.pubNubToken = this.users[1].pubNubToken;
			callback();
		});
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user that is being tracked as the post creator, we use their me-channel
		// we'll be sending the data that we would otherwise send to the tracker
		// service (mixpanel) on this channel, and then we'll validate the data
		this.channelName = `user-${this.users[1].user._id}`;
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

	/* eslint complexity: 0 */
	// validate the message received from pubnub
	validateMessage (message) {
		message = message.message;
		if (message.type !== 'track') {
			return false;
		}
		const data = message.data;
		const errors = [];
		const categories = {
			'channel': 'Private Channel',
			'direct': 'Direct Message',
			'file': 'Source File'
		};
		let category = categories[this.stream.type];
		if (this.makePublic) {
			category = 'Public Channel';
		}
		const result = (
			((message.type === 'track') || errors.push('type not correct')) &&
			((message.event === 'Post Created') || errors.push('event not correct')) &&
			((data.distinct_id === this.users[1].user._id) || errors.push('distinct_id not set to post originator\'s ID')) &&
			((data.Type === 'Chat') || errors.push('Type not correct')) &&
			((data.Thread === 'Parent') || errors.push('Thread not correct')) &&
			((data.Category === category) || errors.push('Category not correct')) &&
			((data['Email Address'] === this.users[1].user.email) || errors.push('Email Address does not match post originator')) &&
			((data['Join Method'] === this.users[1].user.joinMethod) || errors.push('Join Method does not match post originator')) &&
			((data['Team ID'] === this.team._id) || errors.push('Team ID does not match team')) &&
			((data['Team Name'] === this.team.name) || errors.push('Team Name does not match team')) &&
			((data['Provider'] === 'CodeStream') || errors.push('Provider not set to CodeStream')) &&
			((data['Team Size'] === this.team.memberIds.length) || errors.push('Team Size does not match number of members in team')) &&
			((data.Company === this.company.name) || errors.push('Company does not match name of company')) &&
			((data.Endpoint === 'Email') || errors.push('Endpoint not correct')) &&
			((data.Plan === 'Free') || errors.push('Plan not correct')) &&
			((data['Date of Last Post'] === new Date(this.post.createdAt).toISOString()) || errors.push('Date of Last Post not correct')) &&
			((data['Date Signed Up'] === new Date(this.users[1].user.registeredAt).toISOString()) || errors.push('Date Signed Up not correct')) &&
			((data['First Post?'] === new Date(this.post.createdAt).toISOString()) || errors.push('First Post not set to creation date of post')) &&
			((data['Reporting Group'] === '') || errors.push('Reporting Group should be empty string'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		return true;
	}
}

module.exports = TrackingTest;
