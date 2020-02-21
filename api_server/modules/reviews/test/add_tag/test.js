// handle unit tests for the "PUT /reviews/:id/add-tag" request to add a tag to a review

'use strict';

const AddTagTest = require('./add_tag_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const AddToOtherTagTest = require('./add_to_other_tag_test');
const AddToOtherTagFetchTest = require('./add_to_other_tag_fetch_test');
const AddDefaultTagTest = require('./add_default_tag_test');
const AddDefaultTagFetchTest = require('./add_default_tag_fetch_test');
const AddPreviouslyAddedTagTest = require('./add_previously_added_tag_test');
const ReviewNotFoundTest = require('./review_not_found_test');
const ACLTest = require('./acl_test');
const ParameterRequiredTest = require('./parameter_required_test');
const TagNotFoundTest = require('./tag_not_found_test');
const DeactivatedTagTest = require('./deactivated_tag_test');
const DeactivatedDefaultTagTest = require('./deactivated_default_tag_test');

class AddTagRequestTester {

	test () {
		new AddTagTest().test();
		new FetchTest().test();
		new MessageTest().test();
		new AddToOtherTagTest().test();
		new AddToOtherTagFetchTest().test();
		new AddDefaultTagTest().test();
		new AddDefaultTagFetchTest().test();
		new AddPreviouslyAddedTagTest().test();
		new ReviewNotFoundTest().test();
		new ACLTest().test();
		new ParameterRequiredTest({ parameter: 'tagId' }).test();
		new TagNotFoundTest().test();
		new DeactivatedTagTest().test();
		new DeactivatedDefaultTagTest().test();
	}
}

module.exports = new AddTagRequestTester();
