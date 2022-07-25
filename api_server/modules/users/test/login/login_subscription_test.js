'use strict';

const SubscriptionTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/subscription_test');

class LoginSubscriptionTest extends SubscriptionTest {

	constructor (options) {
		super(options);
		this.teamOptions.numRegistered = 2;
		this.teamOptions.creatorIndex = 1;
		//this.streamOptions.creatorIndex = 1;
	}

	get description () {
		const v3AddOn = this.useV3BroadcasterToken ? ', using a V3 PubNub Access Manager issued broadcaster token' : '';
		return `user should be able to subscribe to the ${this.which || 'user'} channel after they login${v3AddOn}`;
	}

	setChannelName (callback) {
		this.whichObject = this.which || this.currentUser.user;
		this.whichChannel = this.which || 'user';
		super.setChannelName(callback);
	}

	// the "current" user now logs in, this should grant access to the expected channel
	triggerSubscription (callback) {
		// make the login request 
		const data = {
			email: this.currentUser.user.email,
			password: this.currentUser.password
		};
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/login',
				data: data
			},
			callback
		);
	}
}

module.exports = LoginSubscriptionTest;
