// handle unit tests for the "PUT /teams/:id" request to update a team

'use strict';

const PutTeamTest = require('./put_team_test');
const PutTeamFetchTest = require('./put_team_fetch_test');
const ACLTest = require('./acl_test');
const TeamNotFoundTest = require('./team_not_found_test');
const MessageToTeamTest = require('./message_to_team_test');
const NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');

class PutTeamRequestTester {

	putTeamTest () {
		new PutTeamTest().test();
		new PutTeamFetchTest().test();
		new ACLTest().test();
		new TeamNotFoundTest().test();
		new MessageToTeamTest().test();
		new NoUpdateOtherAttributeTest({ attribute: 'companyId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'memberIds' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'integrations' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'primaryReferral' }).test();
	}
}

module.exports = PutTeamRequestTester;
