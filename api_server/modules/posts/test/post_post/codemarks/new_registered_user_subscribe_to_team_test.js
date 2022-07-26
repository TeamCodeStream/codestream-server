'use strict';

const SubscriptionTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/subscription_test');
const NewUserRegisteredTest = require('./new_user_registered_test');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');

class NewRegisteredUserSubscribeToTeamTest extends Aggregation(NewUserRegisteredTest, SubscriptionTest) {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress pubnub messages ordinarily, but since we're actually testing them...
	}

	get description () {
		const v3AddOn = this.useV3BroadcasterToken ? ', and using a V3 PubNub Access Manager issued broadcaster token' : '';
		return `user should be able to subscribe to the team channel, when they are a registered user added to a team on the fly by being mentioned in a codemark${v3AddOn}`;
	}

	makeSubscribingData (callback) {
		this.init(error => {
			if (error) { return callback(error); }
			this.subscribingUser = this.createdRegisteredUser;
			callback();
		});
	}

	triggerSubscription (callback) {
		this.createPost(callback);
	}

	setChannelName (callback) {
		this.whichChannel = this.whichObject = 'team';
		super.setChannelName(callback);
	}
}

module.exports = NewRegisteredUserSubscribeToTeamTest;
