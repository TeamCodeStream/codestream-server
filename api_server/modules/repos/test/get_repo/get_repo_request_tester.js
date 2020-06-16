// handle unit tests for the "GET /repos/:id" request

'use strict';

const GetRepoTest = require('./get_repo_test');
const GetOtherRepoTest = require('./get_other_repo_test');
const NotFoundTest = require('./not_found_test');
const ACLTest = require('./acl_test');

class GetRepoRequestTester {

	getRepoTest () {
		new GetRepoTest().test();
		new GetOtherRepoTest().test();
		new NotFoundTest().test();
		new ACLTest().test();
	}
}

module.exports = GetRepoRequestTester;
