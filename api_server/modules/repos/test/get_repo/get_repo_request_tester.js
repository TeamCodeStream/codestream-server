// handle unit tests for the "GET /repos/:id" request

'use strict';

var GetMyRepoTest = require('./get_my_repo_test');
var GetOtherRepoTest = require('./get_other_repo_test');
var NotFoundTest = require('./not_found_test');
var ACLTest = require('./acl_test');

class GetRepoRequestTester {

	getRepoTest () {
		new GetMyRepoTest().test();
		new GetOtherRepoTest().test();
		new NotFoundTest().test();
		new ACLTest().test();
	}
}

module.exports = GetRepoRequestTester;
