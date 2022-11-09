// handle unit tests for the "POST /xenv/publish-ejc request to publish
// eligible join companies for an email across environments

'use strict';

const PublishEligibleJoinCompaniesTest = require('./publish_eligible_join_companies_test');
const EmailRequiredTest = require('./email_required_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
const MessageTest = require('./message_test');

class ConfirmUserRequestTester {

	test () {
		new PublishEligibleJoinCompaniesTest().test();
		new EmailRequiredTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
		new MessageTest().test();
	}
}

module.exports = new ConfirmUserRequestTester();
