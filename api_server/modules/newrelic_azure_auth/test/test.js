'use strict';

// make eslint happy
/* globals describe */

const VerifyNRAzurePasswordTest = require('./verify_nr_azure_password_test');
const NoAttributeTest = require('./no_attribute_test');
const InvalidPasswordTest = require('./invalid_password_test');
const InvalidEmailTest = require('./invalid_email_test');

describe('newrelic azure', function () {
	new VerifyNRAzurePasswordTest().test();
	new NoAttributeTest({ attribute: 'email' }).test();
	new NoAttributeTest({ attribute: 'password' }).test();
	new InvalidPasswordTest().test();
	new InvalidEmailTest().test();
});
