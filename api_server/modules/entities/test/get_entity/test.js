// handle unit tests for the "GET /entities/:id" request,
// to fetch a New Relic entity

'use strict';

const GetEntityTest = require('./get_entity_test');
const NotFoundTest = require('./not_found_test');
const ACLTest = require('./acl_test');
const GetOtherEntityTest = require('./get_other_entity_test');

class GetEntityRequestTester {

	test () {
		new GetEntityTest().test();
		new NotFoundTest().test();
		new ACLTest().test();
		new GetOtherEntityTest().test();
	}
}

module.exports = new GetEntityRequestTester();
