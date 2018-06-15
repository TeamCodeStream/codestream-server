// handle unit tests for the "PUT /users" request

'use strict';

var PutUserTest = require('./put_user_test');
var PutUserFetchTest = require('./put_user_fetch_test');
var UpdateMeTest = require('./update_me_test');
var ACLTest = require('./acl_test');
var ACLTeamTest = require('./acl_team_test');
var MessageToTeamTest = require('./message_to_team_test');
var NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');
var UsernameNotUniqueTest = require('./username_not_unique_test');
var NoCodestreamUsernameTest = require('./no_codestream_username_test');
var UsernameNotUniqueForSecondTeamTest = require('./username_not_unique_for_second_team_test');

const UserAttributes = require('../../user_attributes');
const CAN_UPDATE_ATTRIBUTES = ['username', 'firstName', 'lastName', 'timeZone'];

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
