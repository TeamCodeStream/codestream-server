// handle unit tests for the "PUT /markers/:id/reference-location" request to add a 
// reference location for a marker

'use strict';

const ReferenceLocationTest = require('./reference_location_test');
const FetchTest = require('./fetch_test');
const ACLTest = require('./acl_test');
const MarkerNotFoundTest = require('./marker_not_found_test');
const MessageToTeamTest = require('./message_to_team_test');
const CommitHashRequiredTest = require('./commit_hash_required_test');
const NoLocationTest = require('./no_location_test');

class ReferenceLocationRequestTester {

	test () {
		new ReferenceLocationTest().test();
		new FetchTest().test();
		new ACLTest().test();
		new MarkerNotFoundTest().test();
		new MessageToTeamTest().test();
		new CommitHashRequiredTest().test();
		new NoLocationTest().test();
	}
}

module.exports = new ReferenceLocationRequestTester();
