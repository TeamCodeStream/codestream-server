// handle unit tests for the "GET /items" request to fetch knowledge base items

'use strict';

const GetItemsTest = require('./get_items_test');
const GetItemsWithMarkersTest = require('./get_items_with_markers_test');
const GetItemsByTypeTest = require('./get_items_by_type_test');
const GetPostlessItemsTest = require('./get_postless_items_test');
const GetPostlessItemsByTypeTest = require('./get_postless_items_by_type_test');
const GetPostlessItemsWithMarkersTest = require('./get_postless_items_with_markers_test');
const GetItemsBeforeTest = require('./get_items_before_test');
const GetItemsAfterTest = require('./get_items_after_test');
//const ACLTest = require('./acl_test');

class GetItemsRequestTester {

	test () {
		new GetItemsTest().test();
		new GetItemsWithMarkersTest().test();
		new GetItemsByTypeTest().test();
		new GetPostlessItemsTest().test();
		new GetPostlessItemsByTypeTest().test();
		new GetPostlessItemsWithMarkersTest().test();
		new GetItemsBeforeTest().test();
		new GetItemsAfterTest().test();
		//new ACLTest().test();
	}
}

module.exports = new GetItemsRequestTester();
