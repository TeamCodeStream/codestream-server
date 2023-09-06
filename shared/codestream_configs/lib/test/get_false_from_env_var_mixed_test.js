const Assert = require('assert');
const GenericTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/generic_test');
const StructuredConfigBase = require('../structured_config_base');

class GetFalseFromEnvVarMixedTest extends GenericTest {
	get description () {
		return 'should convert environment variable "False" mixed case string to a boolean false type';
	}

	run (callback) {
		(async () => {
			const config = new StructuredConfigBase();
			const schema = {
				'testBooleanOne': {
					type: 'boolean',
					default: true,
					desc: 'test',
					env: 'TEST_BOOLEAN_1'
				}
			};
			const prop = 'testBooleanOne';
			const data = {
				testBooleanOne: "${TEST_BOOLEAN_1}"
			}
			process.env.TEST_BOOLEAN_1 = 'False';
			const response = config._getConfigValue(prop, schema, data);
			Assert.equal(response, false);
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

module.exports = GetFalseFromEnvVarMixedTest;
