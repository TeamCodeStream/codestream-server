const Assert = require('assert');
const GenericTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/generic_test');
const StructuredConfigBase = require('../structured_config_base');

class GetFalseFromNumericEnvVarTest extends GenericTest {
	get description () {
		return 'should convert environment variable "0" string to a boolean false type';
	}

	run (callback) {
		(async () => {
			const config = new StructuredConfigBase();
			const schema = {
				'testVarOne': {
					type: 'boolean',
					default: true,
					desc: 'test',
					env: 'TEST_ENV_1'
				}
			};
			const prop = 'testVarOne';
			const data = {
				testBooleanOne: "${TEST_ENV_1}"
			}
			process.env.TEST_ENV_1 = '0';
			const response = config._getConfigValue(prop, schema, data);
			Assert.equal(response, false);
			callback();
		})();
	}

	after (callback) {
		(async () => {
			delete process.env['TEST_ENV_1'];
			callback();
		})();
	}
}

module.exports = GetFalseFromNumericEnvVarTest;
