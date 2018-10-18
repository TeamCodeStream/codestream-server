'use strict';

const ChannelOnTheFlyTest = require('./channel_on_the_fly_test');

class ACLTeamOnTheFlyTest extends ChannelOnTheFlyTest {

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			this.streamOptions.members = [];
			callback();
		});
	}

	get description () {
		return 'should return an error when trying to create a post in an on-the-fly stream for a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'user not on team'
		};
	}
}

module.exports = ACLTeamOnTheFlyTest;
