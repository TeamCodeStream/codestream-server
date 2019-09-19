'use strict';

const TrackingTest = require('./tracking_test');

class NoCodeStreamUserTest extends TrackingTest {

	constructor (options) {
		super(options);
		delete this.teamOptions.creatorIndex;
		this.userOptions.numRegistered = 0;
	}

	get description () {
		return `when the user initiating a ${this.provider} action is not a CodeStream user, a tracking message should still be sent with the slack ID as distinct_id`;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			// override NOT creating a team, we'll create a team, but not a connected user
			this.userOptions.numRegistered = 1;
			this.teamOptions.creatorIndex = 0;
			this.teamOptions.numAdditionalInvites = 0;
			this.dontCreateUser = true;
			callback();
		});
	}

	setChannelName (callback) {
		// since the analytics service on the API server won't have a CodeStream user to send the mock tracking 
		// message to, we'll have the service send it to the team creator's user channel instead
		this.user = this.currentUser.user;
		super.setChannelName(callback);
	}
}

module.exports = NoCodeStreamUserTest;
