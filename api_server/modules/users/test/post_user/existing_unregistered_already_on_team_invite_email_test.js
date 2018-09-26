'use strict';

const InviteEmailTest = require('./invite_email_test');

class ExistingUnregisteredAlreadyOnTeamInviteEmailTest extends InviteEmailTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserAlreadyOnTeam = true;
		this.expectedCampaign = 'reinvite_email';
	}

	get description () {
		return 'should send an invite email when inviting an unregistered user that is already on the team';
	}

}

module.exports = ExistingUnregisteredAlreadyOnTeamInviteEmailTest;
