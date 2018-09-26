// handle unit tests for the "PUT /users" request

'use strict';

const PutUserTest = require('./put_user_test');
const PutUserFetchTest = require('./put_user_fetch_test');
const UpdateMeTest = require('./update_me_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const MessageToTeamTest = require('./message_to_team_test');
const NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');
const UsernameNotUniqueTest = require('./username_not_unique_test');
const NoCodestreamUsernameTest = require('./no_codestream_username_test');
const UsernameNotUniqueForSecondTeamTest = require('./username_not_unique_for_second_team_test');

const UserAttributes = require('../../user_attributes');
const CAN_UPDATE_ATTRIBUTES = ['username', 'fullName', 'timeZone', 'phoneNumber', 'iWorkOn'];

class PutUserRequestTester {

	putUserTest () {
		new PutUserTest().test();
		new PutUserFetchTest().test();
		new UpdateMeTest().test();
		CAN_UPDATE_ATTRIBUTES.forEach(attribute => {
			new PutUserTest({ attributes: [attribute] }).test();
		});
		new ACLTest().test();
		new ACLTeamTest().test();
		new MessageToTeamTest().test();
		Object.keys(UserAttributes).forEach(attribute => {
			if (!CAN_UPDATE_ATTRIBUTES.includes(attribute)) {
				new NoUpdateOtherAttributeTest({ otherAttribute: attribute }).test();
			}
		});
		new UsernameNotUniqueTest().test();
		new NoCodestreamUsernameTest().test();
		new UsernameNotUniqueForSecondTeamTest().test();
	}
}

module.exports = PutUserRequestTester;
