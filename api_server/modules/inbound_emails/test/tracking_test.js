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
			this.broadcasterToken = this.users[1].broadcasterToken;
			callback();
		});
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user that is being tracked as the post creator, we use their me-channel
		// we'll be sending the data that we would otherwise send to the tracker
		// service on this channel, and then we'll validate the data
		this.channelName = `user-${this.users[1].user.id}`;
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
		const { type, data } = message;
		if (type !== 'track') {
			return false;
		}
		const { properties } = data;
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
			((data.userId === this.users[1].user.id) || errors.push('userId not set to post originator\'s ID')) && 
			((data.event === 'Post Created') || errors.push('event not correct')) &&
			((properties.distinct_id === this.users[1].user.id) || errors.push('distinct_id not set to post originator\'s ID')) &&
			((properties.Type === 'Chat') || errors.push('Type not correct')) &&
			((properties.Thread === 'Parent') || errors.push('Thread not correct')) &&
			((properties.Category === category) || errors.push('Category not correct')) &&
			((properties['email'] === this.users[1].user.email) || errors.push('email does not match post originator')) &&
			((properties['Join Method'] === this.users[1].user.joinMethod) || errors.push('Join Method does not match post originator')) &&
			((properties['Team ID'] === this.team.id) || errors.push('Team ID does not match team')) &&
			((properties['Team Name'] === this.team.name) || errors.push('Team Name does not match team')) &&
			((properties['Provider'] === 'CodeStream') || errors.push('Provider not set to CodeStream')) &&
			((properties['Team Size'] === this.team.memberIds.length) || errors.push('Team Size does not match number of members in team')) &&
			((properties['Company Name'] === this.company.name) || errors.push('Company Name does not match name of company')) &&
			((properties.Endpoint === 'Email') || errors.push('Endpoint not correct')) &&
			((properties['Date of Last Post'] === new Date(this.post.createdAt).toISOString()) || errors.push('Date of Last Post not correct')) &&
			((properties['createdAt'] === new Date(this.users[1].user.registeredAt).toISOString()) || errors.push('createdAt not correct')) &&
			((properties['First Post?'] === new Date(this.post.createdAt).toISOString()) || errors.push('First Post not set to creation date of post')) &&
			((properties['Reporting Group'] === '') || errors.push('Reporting Group should be empty string'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		return true;
	}
}

module.exports = TrackingTest;
