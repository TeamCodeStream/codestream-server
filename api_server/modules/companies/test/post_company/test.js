// handle unit tests for the "POST /companies" request, to create a company

'use strict';

const PostCompanyTest = require('./post_company_test');
const NoAttributeTest = require('./no_attribute_test');
const MessageToUserTest = require('./message_to_user_test');

class PostCompanyRequestTester {

	test () {
		new PostCompanyTest().test();
		new NoAttributeTest({ attribute: 'name' }).test();
		new MessageToUserTest().test();
	}
}

module.exports = new PostCompanyRequestTester();
