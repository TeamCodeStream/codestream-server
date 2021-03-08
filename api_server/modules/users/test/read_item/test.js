// handle unit tests for the "PUT /read-item/:postId" request, to set the number of read replies 
// to a codemark or a review for the user

'use strict';

const ReadItemTest = require('./read_item_test');
const ReadItemFetchTest = require('./read_item_fetch_test');
const ReadItemACLTest = require('./read_item_acl_test');
const NumRepliesRequiredTest = require('./num_replies_required_test');
const PostNotFoundTest = require('./post_not_found_test');
const ReadItemMessageTest = require('./read_item_message_test');

class ReadItemRequestTester {

	test () {
		new ReadItemTest().test();
		new ReadItemFetchTest().test();
		new ReadItemACLTest().test();
		new NumRepliesRequiredTest().test();
		new PostNotFoundTest().test();
		new ReadItemMessageTest().test();
	}
}

module.exports = new ReadItemRequestTester();
