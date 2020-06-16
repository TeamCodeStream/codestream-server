'use strict';

const InboundEmailTest = require('./inbound_email_test');

class OriginatorNotInTeamTest extends InboundEmailTest {

	get description () {
		return 'should return an error when trying to send an inbound email with an originator who is not on the team indicated';
	}

	getExpectedError () {
		return {
			code: 'INBE-1001',
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.creatorIndex = 0;
			this.teamOptions.members = [];
			this.teamOptions.numAdditionalInvites = 0;
			this.streamOptions.creatorIndex = 0;
			callback();
		});
	}
}

module.exports = OriginatorNotInTeamTest;
