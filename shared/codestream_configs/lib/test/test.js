const GetFalseFromEnvVarTest = require('./get_false_from_env_var_test');
const GetFalseFromNumericEnvVarTest = require('./get_false_from_numeric_env_var_test');
const GetTrueFromEnvVarTest = require('./get_true_from_env_var_test');
const GetTrueFromNumericEnvVarTest = require('./get_true_from_numeric_env_var_test');
const GetNumberFromEnvVarTest = require('./get_number_from_env_var_test');
const GetFalseFromEnvVarMixedTest = require('./get_false_from_env_var_mixed_test');
const InterpolateFalseFromEnvVarTest = require('./interpolate_false_from_env_var_test');
const InterpolateTrueFromEnvVarTest = require('./interpolate_true_from_env_var_test');
const InterpolatePassesUntypedAsStringTest = require('./interpolate_passses_string_when_no_type_test');

describe('structured config', function() {
	new GetFalseFromEnvVarTest().test();
	new GetFalseFromNumericEnvVarTest().test();
	new GetTrueFromEnvVarTest().test();
	new GetTrueFromNumericEnvVarTest().test();
	new GetNumberFromEnvVarTest().test();
	new GetFalseFromEnvVarMixedTest().test();
	new InterpolateFalseFromEnvVarTest().test();
	new InterpolateTrueFromEnvVarTest().test();
	new InterpolatePassesUntypedAsStringTest().test();
});
