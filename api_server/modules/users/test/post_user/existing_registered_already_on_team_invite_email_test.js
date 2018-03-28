'use strict';

const InviteEmailTest = require('./invite_email_test');
const Assert = require('assert');

class ExistingRegisteredAlreadyOnTeamInviteEmailTest extends InviteEmailTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserIsRegistered = true;
		this.existingUserAlreadyOnTeam = true;
	}

	get description () {
		return 'should NOT send an invite email when inviting a registered user that is already on the team';
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error, message) {
		if (error) { return this.messageCallback(error); }
		message = message.message;
		if (!message.from && !message.to) { return false; }	// ignore anything not matching
		Assert.fail('message was received');
	}

}

module.exports = ExistingRegisteredAlreadyOnTeamInviteEmailTest;
