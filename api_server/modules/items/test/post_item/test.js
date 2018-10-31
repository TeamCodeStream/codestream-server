// handle unit tests for the "POST /items" request to create a knowledge base item

'use strict';

const PostItemTest = require('./post_item_test');
const MarkerTest = require('./marker_test');
const ExistingStreamTest = require('./existing_stream_test');

class PostItemRequestTester {

	test () {
		new PostItemTest().test();
		new MarkerTest().test();
		new ExistingStreamTest().test();
	}
}

module.exports = new PostItemRequestTester();
