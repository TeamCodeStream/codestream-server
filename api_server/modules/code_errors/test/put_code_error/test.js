// handle unit tests for the "PUT /code-errors" request to update a code error

'use strict';

const PutCodeErrorTest = require('./put_code_error_test');
const UpdateMineTest = require('./update_mine_test');
//const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const CodeErrorNotFoundTest = require('./code_error_not_found_test');
const PutCodeErrorFetchTest = require('./put_code_error_fetch_test');
const NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');
const MessageTest = require('./message_test');
const UpdateClaimedTest = require('./update_claimed_test');
const NoUpdateUnclaimedTest = require('./no_update_unclaimed_test');
const NoUpdateClaimedByOtherTeamTest = require('./no_update_claimed_by_other_team_test');

class PutCodeErrorRequestTester {

	test () {
		new PutCodeErrorTest().test();
		new UpdateMineTest().test();
		//new ACLTest().test();
		new ACLTeamTest().test();
		new CodeErrorNotFoundTest().test();
		new PutCodeErrorFetchTest().test();
		new NoUpdateOtherAttributeTest({ attribute: 'teamId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'postId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'streamId' }).test();
		new MessageTest().test();
		new UpdateClaimedTest().test();
		new NoUpdateUnclaimedTest().test();
		new NoUpdateClaimedByOtherTeamTest().test();
	}
}

module.exports = new PutCodeErrorRequestTester();
