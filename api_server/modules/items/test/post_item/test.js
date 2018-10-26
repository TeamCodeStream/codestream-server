// handle unit tests for the "POST /items" request to create a knowledge base item

'use strict';

const PostItemTest = require('./post_item_test');
const CodeBlockTest = require('./code_block_test');

class PostItemRequestTester {

	test () {
		new PostItemTest().test();
		new CodeBlockTest().test();
	}
}

module.exports = new PostItemRequestTester();
