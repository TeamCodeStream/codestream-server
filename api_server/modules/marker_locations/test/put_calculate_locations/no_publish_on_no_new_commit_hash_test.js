'use strict';

var MessageToTeamTest = require('./message_to_team_test');
var Assert = require('assert');

class NoPublishOnNoNewCommitHashTest extends MessageToTeamTest {

	constructor (options) {
		super(options);
		this.noNewCommitHash = true;
	}

	get description () {
		return 'members of the team should not receive a message with the marker location update if a marker location calculation is made with no newCommitHash';
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

module.exports = NoPublishOnNoNewCommitHashTest;
