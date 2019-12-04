'use strict';

const Assert = require('assert');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');

class TrackingTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'should send a Notification Change event for tracking purposes when user follows email link to unfollow a codemark';
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
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: this.path,
				testTracking: true,
				reallyTrack: true,
				requestOptions: {
					noJsonInResponse: true,
					expectRedirect: true
				}
			},
			callback
		);
	}

	// validate the message received from pubnub
	validateMessage (message) {
		message = message.message;
		const { type, data } = message;
		if (type !== 'track') {
			return false;
		}
		const expectedMessage = {
			userId: this.currentUser.user.id,
			event: 'Notification Change',
			properties: {
				$created: new Date(this.currentUser.user.registeredAt).toISOString(),
				$email: this.currentUser.user.email,
				'Join Method': 'Added to Team',
				'Team ID': this.team.id,
				'Team Size': 3,
				'Team Name': this.team.name,
				'Team Created Date': new Date(this.team.createdAt).toISOString(),
				Plan: '30DAYTRIAL',
				Provider: 'CodeStream',
				'Company Name': this.company.name,
				'Company ID': this.company.id,
				'Reporting Group': '',
				distinct_id: this.currentUser.user.id,
				Change: 'Codemark Unfollowed',
				'Source of Change': 'Email link'
			}
		};
		Assert.deepEqual(data, expectedMessage, 'tracking data not correct');
		return true;
	}
}

module.exports = TrackingTest;
