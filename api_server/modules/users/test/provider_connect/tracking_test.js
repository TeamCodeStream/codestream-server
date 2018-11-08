'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CommonInit = require('./common_init');
const Assert = require('assert');

class TrackingTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		let desc = 'should send a Provider Connect Succeeded event for tracking purposes when a user signs in using a third-party provider';
		if (this.wantPreExistingTeam) {
			desc += ', with pre-existing team';
		}
		if (this.wantPreExistingUnconnectedUser) {
			desc += ', with pre-existing unconnected user';
		}
		if (this.wantPreExistingConnectedUser) {
			desc += ', with pre-existing connected user';
		}
		return desc;
	}

	// make the data the will be used when issuing the request that triggers the message
	makeData (callback) {
		this.init(callback);
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// we don't know the user ID until the actual connect call is made, so instead
		// we're going to "hijack" the current user's me-channel and listen to that
		// we'll be sending the data that we would otherwise send to the tracker
		// service (mixpanel) on this channel, and then we'll validate the data
		this.channelName = `user-${this.currentUser.user._id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// initiate the request, this should trigger a publish of the tracker message
		this.doProviderConnect(
			this.data,
			(error, response) => {
				if (error) { return callback(error); }
				this.providerConnectResponse = response;
				callback();
			},
			{
				testTracking: true,
				reallyTrack: true,
				trackOnChannel: this.channelName
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
		const { user, teams, companies, signupStatus } = this.providerConnectResponse;
		const team = teams[0];
		const company = companies[0];
		const data = message.data;
		const provider = this.provider.charAt(0).toUpperCase() + this.provider.slice(1);
		const joinMethod = this.wantPreExistingTeam ? 'Added to Team' : 'Created Team';
		const errors = [];
		const result = (
			((message.event === 'Provider Connect Succeeded') || errors.push('event not correct')) &&
			((data.distinct_id === user._id) || errors.push('distinct_id not set to signed-in user ID')) &&
			((data['Email Address'] === user.email) || errors.push('Email Address not correct')) && 
			((data['Registered'] === true) || errors.push('Registered not correct')) &&
			((data['Join Method'] === joinMethod) || errors.push('Join Method not correct')) && 
			((data['Team ID'] === team._id) || errors.push('Team ID not correct')) &&
			((data['Team Size'] === team.memberIds.length) || errors.push('Team Size not correct')) &&
			((data['Team Name'] === team.name) || errors.push('Team Name not correct')) &&
			((data['Provider'] === provider) || errors.push(`Provider not set to ${provider}`)) && 
			((data['Company'] === company.name) || errors.push('incorrect company name')) &&
			((data['Signup Status'] === signupStatus) || errors.push('signupStatus no correct')) &&
			((data['Date Signed Up'] === new Date(user.registeredAt).toISOString()) || errors.push('Date Signed Up not correct'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		return true;
	}
}

module.exports = TrackingTest;
