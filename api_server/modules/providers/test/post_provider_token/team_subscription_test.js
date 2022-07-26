'use strict';

const SubscriptionTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/subscription_test');
const ExistingUnregisteredUserTest = require('./existing_unregistered_user_test');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');

class TeamSubscriptionTest extends Aggregation(ExistingUnregisteredUserTest, SubscriptionTest) {

	get description () {
		const v3AddOn = this.useV3BroadcasterToken ? ', using a V3 PubNub Access Manager issued broadcaster token' : '';
		return `user should be able to subscribe to the team channel, when they have been invited to a team and then sign up by setting a personal access token for ${this.provider}${v3AddOn}`;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.creatorIndex = 0;
			this.teamOptions.members = [];
			this.userOptions.numRegistered = 1;
			this.userOptions.numUnregistered = 1;
			callback();
		});
	}

	makeSubscribingData (callback) {
		this.init(callback);
	}

	setChannelName (callback) {
		this.whichChannel = this.whichObject = 'team';
		this.subscribingUser = this.users[1];
		super.setChannelName(callback);
	}
}

module.exports = TeamSubscriptionTest;
