// handle unit tests for the "PUT /users" request

'use strict';

var PutUserTest = require('./put_user_test');
var UpdateMeTest = require('./update_me_test');
var ACLTest = require('./acl_test');
var ACLTeamTest = require('./acl_team_test');
var MessageToTeamTest = require('./message_to_team_test');
var NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');

const UserAttributes = require('../../user_attributes');
const CAN_UPDATE_ATTRIBUTES = ['username', 'firstName', 'lastName'];

/* jshint -W071 */

class PutUserRequestTester {

	putUserTest () {
                new PutUserTest().test();
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
	}
}

/* jshint +W071 */

module.exports = PutUserRequestTester;
