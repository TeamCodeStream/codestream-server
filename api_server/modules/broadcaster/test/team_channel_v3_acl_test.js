'use strict';

const TeamChannelACLTest = require('./team_channel_acl_test');

class TeamChannelV3ACLTest extends TeamChannelACLTest {

	constructor (options) {
		super(options);
		this.useV3BroadcasterToken = true;
	}

	get description () {
		return 'should get an error when trying to subscribe to a team channel for a team i am not a member of, using a V3 PubNub Access Manager issued token';
	}
}

module.exports = TeamChannelV3ACLTest;
