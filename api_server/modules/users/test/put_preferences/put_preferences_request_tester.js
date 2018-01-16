'use strict';

var PutPreferencesTest = require('./put_preferences_test');
var InvalidParameterTest = require('./invalid_parameter_test');
var SimpleUpdateTest = require('./simple_update_test');
var SetTest = require('./set_test');
var UnsetTest = require('./unset_test');
var SetSubkeyTest = require('./set_subkey_test');
var UnsetSubkeyTest = require('./unset_subkey_test');
var ComplexUpdateTest = require('./complex_update_test');
var TooManyKeysTest = require('./too_many_keys_test');
var InvalidOpTest = require('./invalid_op_test');
var MessageTest = require('./message_test');

class PutPreferencesRequestTester {

	putPreferencesTest () {
		new PutPreferencesTest().test();
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
