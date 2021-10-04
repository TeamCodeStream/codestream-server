// handle unit tests for the "POST /no-auth/validate-email" request to validate that an email is
// confirmed, for the New Relic signup flow

'use strict';

const ValidateEmailTest = require('./validate_email_test');
const EmailRequiredTest = require('./email_required_test');
const EmailNotFoundTest = require('./email_not_found_test');
const NotRegisteredTest = require('./not_registered_test');
const NoIdeTest = require('./no_ide_test');
const JetBrainsTest = require('./jetbrains_test');

class ValidateEmailRequestTester {

	test () {
		new ValidateEmailTest().test();
		new EmailRequiredTest().test();
		new EmailNotFoundTest().test();
		new NotRegisteredTest().test();
		new NoIdeTest().test();
		new JetBrainsTest().test();
	}
}

module.exports = new ValidateEmailRequestTester();
