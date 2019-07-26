// handle unit tests for the "PUT /team-tags/:teamId/:id" request to update a tag for a team

'use strict';

const UpdateTagTest = require('./update_tag_test');
const UpdateDefaultTagTest = require('./update_default_tag_test');
const NoPartialUpdateTest = require('./no_partial_update_test');
const FetchTest = require('./fetch_test');
const FetchDefaultTagUpdatedTest = require('./fetch_default_tag_updated_test');
const FetchNoPartialUpdateTest = require('./fetch_no_partial_update_test');
const MessageTest = require('./message_test');
const TeamNotFoundTest = require('./team_not_found_test');
const TagNotFoundTest = require('./tag_not_found_test');
const ACLTest = require('./acl_test');
const ParameterRequiredTest = require('./parameter_required_test');
const ParameterOptionalTest = require('./parameter_optional_test');

class UpdateTagRequestTester {

	test () {
		new UpdateTagTest().test();
		new UpdateDefaultTagTest().test();
		new NoPartialUpdateTest({ parameter: 'label' }).test();
		new FetchTest().test();
		new FetchDefaultTagUpdatedTest().test();
		new FetchNoPartialUpdateTest({ parameter: 'label' }).test();
		new MessageTest().test();
		new TeamNotFoundTest().test();
		new TagNotFoundTest().test();
		new ACLTest().test();
		new ParameterRequiredTest({ parameter: 'color' }).test();
		new ParameterOptionalTest({ parameter: 'label' }).test();
	}
}

module.exports = new UpdateTagRequestTester();
