// handle unit tests for the "GET /markers/:id" request

'use strict';

const GetMarkerTest = require('./get_marker_test');
const NotFoundTest = require('./not_found_test');
const ACLTest = require('./acl_test');
const GetPostlessMarkerTest = require('./get_postless_marker_test');
const GetPostlessMarkerWithItemTest = require('./get_postless_marker_with_item_test');

class GetRepoRequestTester {

	getMarkerTest () {
		new GetMarkerTest().test();
		new NotFoundTest().test();
		new ACLTest().test();
		new GetPostlessMarkerTest().test();
		new GetPostlessMarkerWithItemTest().test();
	}
}

module.exports = GetRepoRequestTester;
