// handle unit tests for the "PUT /items" request to update a knowledge base item

'use strict';

const PutItemTest = require('./put_item_test');

class PutItemRequestTester {

	test () {
		new PutItemTest().test();
	}
}

module.exports = new PutItemRequestTester();
