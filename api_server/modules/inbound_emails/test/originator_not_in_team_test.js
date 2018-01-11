'use strict';

var InboundEmailTest = require('./inbound_email_test');

class OriginatorNotInTeamTest extends InboundEmailTest {

	constructor (options) {
		super(options);
		this.dontIncludeOtherUser = true;
	}

	get description () {
		return 'should return an error when trying to send an inbound email with an originator who is not on the team indicated';
	}

	getExpectedError () {
		return {
			code: 'INBE-1001',
		};
	}
}

module.exports = OriginatorNotInTeamTest;
