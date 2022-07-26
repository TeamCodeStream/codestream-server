'use strict';

const SubscriptionTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/subscription_test');
const ExistingRegisteredUserTest = require('./existing_registered_user_test');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');

class ExistingRegisteredUserSubcriptionTest extends Aggregation(ExistingRegisteredUserTest, SubscriptionTest) {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress pubnub messages ordinarily, but since we're actually testing them...
	}

	get description () {
		const v3AddOn = this.useV3BroadcasterToken ? ', and using a V3 PubNub Access Manager issued broadcaster token' : '';
		return `user should be able to subscribe to the team channel, when they are a registered user invited to a team${v3AddOn}`;
	}

	makeSubscribingData (callback) {
		this.init(error => {
			if (error) { return callback(error); }
			this.subscribingUser = this.users[this.existingRegisteredUserIndex];
			callback();
		});
	}

	triggerSubscription (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: this.data,
				token: this.users[0].accessToken
			},
			callback
		);
	}

	setChannelName (callback) {
		this.whichChannel = this.whichObject = 'team';
		super.setChannelName(callback);
	}
}

module.exports = ExistingRegisteredUserSubcriptionTest;
