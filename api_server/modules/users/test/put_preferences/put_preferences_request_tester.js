// handles unit tests related to the "PUT /preferences" request for
// setting user preferences

'use strict';

const PutPreferencesTest = require('./put_preferences_test');
const PutPreferencesFetchTest = require('./put_preferences_fetch_test');
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

class PutPreferencesRequestTester {

	putPreferencesTest () {
		new PutPreferencesTest().test();
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
	}
}

module.exports = PutPreferencesRequestTester;
