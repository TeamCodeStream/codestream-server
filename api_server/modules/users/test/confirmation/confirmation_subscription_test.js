'use strict';

const SubscriptionTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/subscription_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const ConfirmationTest = require('./confirmation_test');

class ConfirmationSubscriptionTest extends SubscriptionTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			numAdditionalInvites: 2
		});
		this.teamOptions.numAdditionalInvites = 2;
		//this.streamOptions.creatorIndex = 1;
	}

	get description () {
		const v3AddOn = this.useV3BroadcasterToken ? ', using a V3 PubNub Access Manager issued broadcaster token' : '';
		return `user should be able to subscribe to the ${this.which || 'user'} channel after they confirm registration${v3AddOn}`;
	}

	makeSubscribingData (callback) {
		BoundAsync.series(this, [
			ConfirmationTest.prototype.registerUser.bind(this),
			this.confirm,
			super.makeSubscribingData
		], callback);
	}

	getUserData () {
		const data = this.userFactory.getRandomUserData();
		data.email = this.users[3].user.email;
		return data;
	}
			
	// confirm the user, this gives us an access token and allows us to subscribe to the channel of interest
	confirm (callback) {
		// make the confirmation request to get the access token
		const data = {
			email: this.data.email,
			confirmationCode: this.data.confirmationCode
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.whichObject = this.which || response.user;
				this.whichChannel = this.which || 'user';
				this.subscribingUser = response;
				callback();
			}
		);
	}
}

module.exports = ConfirmationSubscriptionTest;
