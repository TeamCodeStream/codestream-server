// handles unit tests related to the "PUT /team-settings" request for
// setting team settings

'use strict';

const PutTeamSettingsTest = require('./put_team_settings_test');
const PutPreferencesFetchTest = require('./put_team_settings_fetch_test');
const InvalidParameterTest = require('./invalid_parameter_test');
const SimpleUpdateTest = require('./simple_update_test');
const SetTest = require('./set_test');
const UnsetTest = require('./unset_test');
const SetSubkeyTest = require('./set_subkey_test');
const UnsetSubkeyTest = require('./unset_subkey_test');
const ComplexUpdateTest = require('./complex_update_test');
const TooManyKeysTest = require('./too_many_keys_test');
const InvalidOpTest = require('./invalid_op_test');
const MessageTest = require('./message_test');
const AdminsOnlyTest = require('./admins_only_test');
const AdminsOkTest = require('./admins_ok_test');
const TeamNotFoundTest = require('./team_not_found_test');

class PutPreferencesRequestTester {

	putTeamSettingsTest () {
		new PutTeamSettingsTest().test();
		new PutPreferencesFetchTest().test();
		new InvalidParameterTest().test();
		new SimpleUpdateTest().test();
		new SetTest().test();
		new UnsetTest().test();
		new SetSubkeyTest().test();
		new UnsetSubkeyTest().test();
		new ComplexUpdateTest().test();
		new TooManyKeysTest().test();
		new InvalidOpTest().test();
		new MessageTest().test();
		new AdminsOnlyTest().test();
		new AdminsOkTest().test();
		new TeamNotFoundTest().test();
	}
}

module.exports = PutPreferencesRequestTester;
