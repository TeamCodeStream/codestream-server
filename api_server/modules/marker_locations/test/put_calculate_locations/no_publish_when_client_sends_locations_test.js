'use strict';

var MessageToTeamTest = require('./message_to_team_test');
var ClientSendsLocationsTest = require('./client_sends_locations_test');
var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var Assert = require('assert');

class NoPublishWhenClientSendsLocationsTest extends Aggregation(ClientSendsLocationsTest, MessageToTeamTest) {

	get description () {
		return `members of the team should not receive a message with the marker location update if a marker location calculation is made with client-provided locations and no ${this.omittedAttribute}`;
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error) {
		if (error) { return this.messageCallback(error); }
		Assert.fail('message was received');
	}
}

module.exports = NoPublishWhenClientSendsLocationsTest;
