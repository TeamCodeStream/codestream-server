// handle unit tests for the "GET /markers/:id" request

'use strict';

const GetMarkerTest = require('./get_marker_test');
const NotFoundTest = require('./not_found_test');
const ACLTest = require('./acl_test');

class GetRepoRequestTester {

	getMarkerTest () {
		new GetMarkerTest().test();
		new NotFoundTest().test();
		new ACLTest().test();
	}
}

module.exports = GetRepoRequestTester;
