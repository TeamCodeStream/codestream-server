// handle unit tests for the "POST /companies" request, to create a company

'use strict';

const PostCompanyTest = require('./post_company_test');
const NoAttributeTest = require('./no_attribute_test');
const MessageToUserTest = require('./message_to_user_test');
const JoiningTest = require('./joining_test');
const NoWebmailForDomainJoiningTest = require('./no_webmail_for_domain_joining_test');
const NoEmptyStringForCodeHostJoiningTest = require('./no_empty_string_for_code_host_joining_test');

class PostCompanyRequestTester {

	test () {
		new PostCompanyTest().test();
		new NoAttributeTest({ attribute: 'name' }).test();
		new MessageToUserTest().test();
		new JoiningTest().test();
		new NoWebmailForDomainJoiningTest().test();
		new NoEmptyStringForCodeHostJoiningTest().test();
		// TODO: wrong type validations
	}
}

module.exports = new PostCompanyRequestTester();
