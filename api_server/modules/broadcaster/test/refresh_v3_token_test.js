'use strict';

const SubscriptionTest = require('./subscription_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class RefreshV3TokenTest extends SubscriptionTest {

	constructor (options) {
		super(options);
		this.useV3BroadcasterToken = true;
		this.setV3TokenTTL = this.mockMode ? 1/60 : 1;
		this.userOptions.numRegistered = 1;
		this.userOptions.numUnregistered = 0;
	}
	
	get description () {
		return 'after a v3 PubNub Access Manager issued token expires, should be able to refresh it';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.waitForExpire,
			this.obtainV3BroadcasterToken
		], callback);
	}

	waitForExpire (callback) {
		const wait = this.setV3TokenTTL * 60 * 1000 + 1;
		setTimeout(callback, wait);
	}

	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser.user.id;
		callback();
	}
}

module.exports = RefreshV3TokenTest;
