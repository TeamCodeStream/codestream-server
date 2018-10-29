// handle unit tests for the "GET /item" request to fetch a knowledge base item

'use strict';

const GetItemTest = require('./get_item_test');
const GetItemWithMarkerTest = require('./get_item_with_marker_test');
const GetPostlessItemTest = require('./get_postless_item_test');
const GetPostlessItemWithMarkerTest = require('./get_postless_item_with_marker_test');

class GetItemRequestTester {

	test () {
		new GetItemTest().test();
		new GetItemWithMarkerTest().test();
		new GetPostlessItemTest().test();
		new GetPostlessItemWithMarkerTest().test();
	}
}

module.exports = new GetItemRequestTester();
