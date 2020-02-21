// handle unit tests for the "PUT /reviews/:id/remove-tag" request to remove a tag from a review

'use strict';

const RemoveTagTest = require('./remove_tag_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const RemoveFromOtherTagTest = require('./remove_from_other_tag_test');
const RemoveFromOtherTagFetchTest = require('./remove_from_other_tag_fetch_test');
const RemoveDefaultTagTest = require('./remove_default_tag_test');
const RemoveDefaultTagFetchTest = require('./remove_default_tag_fetch_test');
const RemovePreviouslyRemovedTagTest = require('./remove_previously_removed_tag_test');
const ReviewNotFoundTest = require('./review_not_found_test');
const ACLTest = require('./acl_test');
const ParameterRequiredTest = require('./parameter_required_test');
const TagNotFoundTest = require('./tag_not_found_test');
const DeactivatedTagTest = require('./deactivated_tag_test');
const DeactivatedDefaultTagTest = require('./deactivated_default_tag_test');

class AddTagRequestTester {

	test () {
		new RemoveTagTest().test();
		new FetchTest().test();
		new MessageTest().test();
		new RemoveFromOtherTagTest().test();
		new RemoveFromOtherTagFetchTest().test();
		new RemoveDefaultTagTest().test();
		new RemoveDefaultTagFetchTest().test();
		new RemovePreviouslyRemovedTagTest().test();
		new ReviewNotFoundTest().test();
		new ACLTest().test();
		new ParameterRequiredTest({ parameter: 'tagId' }).test();
		new TagNotFoundTest().test();
		new DeactivatedTagTest().test();
		new DeactivatedDefaultTagTest().test();
	}
}

module.exports = new AddTagRequestTester();
