'use strict';

var GetMarkerTest = require('./get_marker_test');
var NotFoundTest = require('./not_found_test');
var ACLTest = require('./acl_test');

class GetRepoRequestTester {

	getMarkerTest () {
		new GetMarkerTest().test();
		new NotFoundTest().test();
		new ACLTest().test();
	}
}

module.exports = GetRepoRequestTester;
