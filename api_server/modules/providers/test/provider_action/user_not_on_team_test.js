'use strict';

const TrackingTest = require('./tracking_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class UserNotOnTeamTest extends TrackingTest {

	get description () {
		return `${this.provider} action request should succeed but no tracking message will be sent if the user initiating the action is not on the team indicated in the action payload`;
	}

	setData (callback) {
		BoundAsync.series(this, [
			super.setData,
			this.createOtherUser,
			this.createOtherTeam
		], callback);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser((error, user) => {
			if (error) { return callback(error); }
			this.otherTeamCreator = user;
			callback();
		});
	}

	createOtherTeam (callback) {
		this.companyFactory.createRandomCompany((error, response) => {
			if (error) { return callback(error); }
			const action = JSON.parse(this.data.actions[0].action_id);
			action.teamId = response.team.id;
			this.data.actions[0].action_id = JSON.stringify(action);
			callback();			
		}, { token: this.otherTeamCreator.accessToken });
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error, message) {
		if (error) { return this.messageCallback(error); }
		if (message.message.type === 'track') {
			Assert.fail('tracking message was received');
		}
	}
}

module.exports = UserNotOnTeamTest;
