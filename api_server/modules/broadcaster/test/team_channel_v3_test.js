'use strict';

const TeamChannelTest = require('./team_channel_test');

class TeamChannelV3Test extends TeamChannelTest {

	constructor (options) {
		super(options);
		this.useV3BroadcasterToken = true;
	}

	get description () {
		return 'should be able to subscribe to and receive a message from the team channels for all my teams as a confirmed user, using a V3 PubNub Access Manager issued token';
	}
}

module.exports = TeamChannelV3Test;
