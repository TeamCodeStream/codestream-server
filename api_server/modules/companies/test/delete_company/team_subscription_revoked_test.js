'use strict';

const SubscriptionRevokedTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/subscription_revoked_test');

class TeamSubscriptionRevokedTest extends SubscriptionRevokedTest {

	get description () {
		const v3AddOn = this.useV3BroadcasterToken ? ', using a V3 PubNub Access Manager issued broadcaster token' : '';
		return `users should no longer be able to subscribe to the team channel for a deleted team${v3AddOn}`;
	}

	makeSubscribingData (callback) {
		this.whichChannel = this.whichObject = 'team';
		// we create a second company so that when we delete the first company,
		// our user isn't orphaned
		this.companyFactory.createRandomCompany(callback, { token: this.currentUser.accessToken });
	}

	triggerSubscriptionRevoked (callback) {
		// delete our original company
		this.doApiRequest(
			{
				method: 'delete',
				path: '/companies/' + this.company.id,
				token: this.currentUser.accessToken
			},
			callback
		);
	}
}

module.exports = TeamSubscriptionRevokedTest;
