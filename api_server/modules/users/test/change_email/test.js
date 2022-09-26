// handle unit tests for the "PUT /change-email" request for a user to change their email 

'use strict';

const ChangeEmailTest = require('./change_email_test');
const ConfirmationEmailTest = require('./confirmation_email_test');
const EmailRequiredTest = require('./email_required_test');
const InvalidEmailTest = require('./invalid_email_test');
const AlreadyTakenTest = require('./already_taken_test');
const AlreadyTakenOkTest = require('./already_taken_ok_test');
const AlreadyTakenInOrgTest = require('./already_taken_in_org_test');

class ChangeEmailRequestTester {

	test () {
		new ChangeEmailTest().test();
		new ConfirmationEmailTest().test();
		new EmailRequiredTest().test();
		new InvalidEmailTest().test();
		new AlreadyTakenTest().test(); // deprecate when we move to ONE_USER_PER_ORG
		new AlreadyTakenTest({ isRegistered: true }).test();
		new AlreadyTakenOkTest().test();
		new AlreadyTakenOkTest({ isRegistered: true }).test();
		new AlreadyTakenOkTest({ isRegistered: true, inCompany: true }).test();
		new AlreadyTakenInOrgTest().test();
		new AlreadyTakenInOrgTest({ isRegistered: true }).test();
	}
}

module.exports = new ChangeEmailRequestTester();
