'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CommonInit = require('./common_init');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class TrackingTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'should send a Team Member Invited event for tracking purposes when a user is invited';
	}

	// make the data the will be used when issuing the request that triggers the message
	makeData (callback) {
		BoundAsync.series(this, [
			this.init,
			this.doLogin
		], callback);
	}

	// perform an actual login before running the test, to set the "First Session" property
	doLogin (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/login',
				token: this.token
			},
			callback
		);
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user originating the request, we use their me-channel
		// we'll be sending the data that we would otherwise send to the tracker
		// service on this channel, and then we'll validate the data
		this.channelName = `user-${this.currentUser.user.id}`;
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
		const { type, data } = message;
		if (type !== 'track') {
			return false;
		}
		const { properties } = data;
		const registered = !!this.existingUserIsRegistered;
		const firstInvite = !this.subsequentInvite;
		const errors = [];
		const result = (
			((data.userId === this.currentUser.user.id) || errors.push('userId not correct')) &&
			((data.event === 'Team Member Invited') || errors.push('event not correct')) &&
			((properties.distinct_id === this.currentUser.user.id) || errors.push('distinct_id not set to request originator\'s ID')) &&
			((properties['Invitee Email Address'] === this.createdUser.email) || errors.push('Email Address does not match request originator')) &&
			((properties['First Invite'] === firstInvite) || errors.push('First Invite not correct')) &&
			((properties['$email'] === this.currentUser.user.email) || errors.push('email not correct')) && 
			((properties['name'] === this.currentUser.user.fullName) || errors.push('name not correct')) && 
			((properties['Registered'] === registered) || errors.push('Registered not correct')) &&
			((properties['Join Method'] === 'Created Team') || errors.push('Join Method not correct')) && 
			((properties['Team ID'] === this.team.id) || errors.push('Team ID not correct')) &&
			((properties['Team Size'] === this.team.memberIds.length + 1) || errors.push('Team Size not correct')) &&
			((properties['Team Name'] === this.team.name) || errors.push('Team Name not correct')) &&
			((properties['Team Created Date'] === new Date(this.team.createdAt).toISOString()) || errors.push('Team Created Date not correct')) &&
			((properties['Plan'] === '30DAYTRIAL') || errors.push('Plan not equal to 30DAYTRIAL')) &&			
			((properties['Company Name'] === this.company.name) || errors.push('incorrect company name')) &&
			((properties['Company ID'] === this.company.id) || errors.push('incorrect company ID')) &&
			((properties['Endpoint'] === 'Unknown IDE') || errors.push('IDE should be unknown')) &&
			((properties['Plugin Version'] === '') || errors.push('Plugin Version should be blank')) &&
			((properties['$created'] === new Date(this.currentUser.user.registeredAt).toISOString()) || errors.push('createdAt not correct')) &&
			((properties['Reporting Group'] === '') || errors.push('Reporting Group should be empty string')) &&
			((properties['First Session'] === true) || errors.push('First Session should be true')) &&
			((properties.company.id === this.company.id) || errors.push('company.id not correct')) &&
			((properties.company.name === this.company.name) || errors.push('company.name not correct')) &&
			((properties.company.created_at === new Date(this.company.createdAt).toISOString()) || errors.push('company.createdAt not correct')) &&
			((properties.company.plan === '30DAYTRIAL') || errors.push('company.plan not correct')) &&
			((properties.company.trialStart_at === new Date(this.company.trialStartDate).toISOString()) || errors.push('company.trialStart_at not correct')) &&
			((properties.company.trialEnd_at === new Date(this.company.trialEndDate).toISOString()) || errors.push('company.trialEnd_at not correct'))

		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		return true;
	}
}

module.exports = TrackingTest;
