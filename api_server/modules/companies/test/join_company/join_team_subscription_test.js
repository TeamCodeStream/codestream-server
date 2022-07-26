'use strict';

const SubscriptionTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/subscription_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

// a class to check if the user can subscribe to the everyone-team channel when they join a company
class JoinTeamSubscriptionTest extends SubscriptionTest {

	get description () {
		const v3AddOn = this.useV3BroadcasterToken ? ', using a V3 PubNub Access Manager issued broadcaster token' : '';
		return `user should be able to subscribe to the team channel for the everyone team of a company when they are added to the company${v3AddOn}`;
	}

	makeSubscribingData (callback) {
		BoundAsync.series(this, [
			this.createCompany,
			this.inviteUser
		], callback);
	}

	createCompany (callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.createdCompanyTeam = response.team;
				this.whichObject = this.createdCompanyTeam = response.team;
				this.whichChannel = 'team';
				callback();
			},
			{
				token: this.users[1].accessToken 
			}
		);
	}

	inviteUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.currentUser.user.email,
					teamId: this.createdCompanyTeam.id
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}
}

module.exports = JoinTeamSubscriptionTest;
