// handle unit tests for the "POST /team-tags/:id" request to add a new tag for a team

'use strict';

const CreateTagTest = require('./create_tag_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const TeamNotFoundTest = require('./team_not_found_test');
const ACLTest = require('./acl_test');
const ParameterRequiredTest = require('./parameter_required_test');
const ParameterOptionalTest = require('./parameter_optional_test');
const NoCreateDefaultTagTest = require('./no_create_default_tag_test');
const NoCreateExistingTagTest = require('./no_create_existing_tag_test');

class CreateTagRequestTester {

	test () {
		new CreateTagTest().test();
		new FetchTest().test();
		new MessageTest().test();
		new TeamNotFoundTest().test();
		new ACLTest().test();
		new ParameterRequiredTest({ parameter: 'id' }).test();
		new ParameterRequiredTest({ parameter: 'color' }).test();
		new ParameterRequiredTest({ parameter: 'sortOrder' }).test();
		new ParameterOptionalTest({ parameter: 'label' }).test();
		new NoCreateDefaultTagTest().test();
		new NoCreateExistingTagTest().test();
	}
}

module.exports = new CreateTagRequestTester();
