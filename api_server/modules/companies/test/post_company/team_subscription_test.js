'use strict';

const SubscriptionTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/subscription_test');

// a class to check if the user gets subscribed to the everyone-team channel when a company is created
class TeamSubscriptionTest extends SubscriptionTest {

	get description () {
		const v3AddOn = this.useV3BroadcasterToken ? ', using a V3 PubNub Access Manager issued broadcaster token' : '';
		return `user should be able to subscribe to the team channel for the everyone team of a company when they create a new company${v3AddOn}`;
	}

	makeSubscribingData (callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.whichObject = response.team;
				this.whichChannel = 'team';
				callback();
			},
			{
				token: this.currentUser.accessToken
			}
		)
	}
}

module.exports = TeamSubscriptionTest;
