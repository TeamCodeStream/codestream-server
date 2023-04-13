// tests for IDP Sync, that (mocked) IDP information gets properly sync'd on login

'use strict';

const ChangeNameTest = require('./change_name_test');
const ChangeEmailTest = require('./change_email_test');
const ChangeOrgNameTest = require('./change_org_name_test');
const DeactivateOrgTest = require('./deactivate_org_test');
const DeactivateUserTest = require('./deactivate_user_test');
const ChangeNameMessageTest = require('./change_name_message_test');
const ChangeEmailMessageTest = require('./change_email_message_test');
const ChangeOrgNameMessageTest = require('./change_org_name_message_test');
const DeactivateUserMessageTest = require('./deactivate_user_message_test');

class IDPSyncTester {

	test () {
		new ChangeNameTest().test();
		new ChangeEmailTest().test();
		new ChangeOrgNameTest().test();
		new DeactivateOrgTest().test();
		new DeactivateUserTest().test();
		new ChangeNameMessageTest().test();
		new ChangeEmailMessageTest().test();
		new ChangeOrgNameMessageTest().test();
		new DeactivateUserMessageTest().test();
	}
}

module.exports = new IDPSyncTester();
