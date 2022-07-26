'use strict';

const SubscriptionRevokedTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/subscription_revoked_test');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const RemoveUserTest = require('./remove_user_test');

class TeamSubscriptionRevokedTest extends Aggregation(RemoveUserTest, SubscriptionRevokedTest) {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress pubnub messages ordinarily, but since we're actually testing them...
	}

	get description () {
		const v3AddOn = this.useV3BroadcasterToken ? ', using a V3 PubNub Access Manager issued broadcaster token' : '';
		return `users removed from a team should no longer be able to subscribe to the team channel for that team${v3AddOn}`;
	}

	makeSubscribingData (callback) {
		this.init(error => {
			if (error) { return callback(error); }
			const removedUsers = this.getRemovedUsers();
			this.subscribingUser = this.users.find(u => u.user.id === removedUsers[0].id);
			this.whichChannel = this.whichObject = 'team';
			callback();
		});
	}

	triggerSubscriptionRevoked (callback) {
		this.updateTeam(callback);
	}
}

module.exports = TeamSubscriptionRevokedTest;
