const Assert = require('assert');
const GenericTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/generic_test');
const StructuredConfigBase = require('../structured_config_base');

class GetNumberFromEnvVarTest extends GenericTest {
	get description () {
		return 'should convert environment variable "2134" string to a number type';
	}

	run (callback) {
		(async () => {
			const config = new StructuredConfigBase();
			const schema = {
				'testVarOne': {
					type: 'number',
					default: true,
					desc: 'test',
					env: 'TEST_ENV_1'
				}
			};
			const prop = 'testVarOne';
			const data = {
				testVarOne: "${TEST_ENV_1}"
			}
			process.env.TEST_ENV_1 = '2134';
			const response = config._getConfigValue(prop, schema, data);
			Assert(Number.isInteger(response));
			Assert.equal(response, 2134);
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

module.exports = GetNumberFromEnvVarTest;
