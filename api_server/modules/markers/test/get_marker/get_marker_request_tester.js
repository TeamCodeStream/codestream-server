// handle unit tests for the "GET /markers/:id" request

'use strict';

const GetMarkerTest = require('./get_marker_test');
const NotFoundTest = require('./not_found_test');
const ACLTest = require('./acl_test');
const GetPostlessMarkerTest = require('./get_postless_marker_test');

class GetRepoRequestTester {

	getMarkerTest () {
		new GetMarkerTest().test();
		new NotFoundTest().test();
		new ACLTest().test();
		new GetPostlessMarkerTest().test();
	}
}

module.exports = GetRepoRequestTester;
