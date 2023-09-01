const Assert = require('assert');
const GenericTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/generic_test');
const StructuredConfigBase = require('../structured_config_base');

class InterpolateFalseFromEnvVarTest extends GenericTest {
	get description () {
		return 'interpolate should convert environment variable "false" string to a boolean false type';
	}

	run (callback) {
		(async () => {
			const config = new StructuredConfigBase();
			process.env.TEST_BOOLEAN_1 = 'false';
			const response = config._interpolate('${TEST_BOOLEAN_1}', process.env, 'boolean');
			Assert(response === false);
			callback();
		})();
	}

	after (callback) {
		(async () => {
			delete process.env['TEST_BOOLEAN_1'];
			callback();
		})();
	}
}

module.exports = InterpolateFalseFromEnvVarTest;
