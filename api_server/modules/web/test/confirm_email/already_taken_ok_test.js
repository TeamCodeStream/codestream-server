'use strict';

const AlreadyTakenTest = require('./already_taken_test');
const Assert = require('assert');

class AlreadyTakenOkTest extends AlreadyTakenTest {

	constructor (options) {
		super(options);
		this.oneUserPerOrg = true; // ONE_USER_PER_ORG
	}

	get description () {
		const which = this.isRegistered ? 'registered' : 'unregistered';
		const inAnOrg = this.inCompany ? ' in a company' : '';
		return `under one-user-per-org, should be ok to send a confirm change of email request confirming the change of the email to another (${which}) user${inAnOrg}, as long as they are not in the same org`;
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data, '/web/confirm-email-complete', 'improper redirect');
	}
}

module.exports = AlreadyTakenOkTest;
