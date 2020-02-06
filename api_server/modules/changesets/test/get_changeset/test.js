// handle unit tests for the "GET /changeset" request to fetch a knowledge base changeset

'use strict';

const GetChangesetTest = require('./get_changeset_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const NotFoundTest = require('./not_found_test');

class GetChangesetRequestTester {

	test () {
		new GetChangesetTest().test();
		new ACLTest({ type: 'direct' }).test();
		new ACLTest({ type: 'channel' }).test();
		new ACLTeamTest({ type: 'direct' }).test();
		new ACLTeamTest({ type: 'channel' }).test();
		new NotFoundTest().test();
	}
}

module.exports = new GetChangesetRequestTester();
