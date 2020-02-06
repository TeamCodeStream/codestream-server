// handle unit tests for the "GET /changesets" request to fetch code review changesets

'use strict';

const GetChangesetsTest = require('./get_changesets_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const ReviewIDRequiredTest = require('./review_id_required_test');
const ReviewNotFoundTest = require('./review_not_found_test');

class GetChangesetsRequestTester {

	test () {
		new GetChangesetsTest().test();
		new ACLTest({ type: 'channel' }).test();
		new ACLTest({ type: 'direct' }).test();
		new ACLTeamTest({ type: 'channel' }).test();
		new ACLTeamTest({ type: 'direct' }).test();
		new ReviewIDRequiredTest().test();
		new ReviewNotFoundTest().test();
	}
}

module.exports = new GetChangesetsRequestTester();
