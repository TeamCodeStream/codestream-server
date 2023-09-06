const Assert = require('assert');
const GenericTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/generic_test');
const StructuredConfigBase = require('../structured_config_base');

class InterpolatePassesUntypedAsStringTest extends GenericTest {
	get description () {
		return 'interpolate should pass through the string when there is no type';
	}

	run (callback) {
		(async () => {
			const config = new StructuredConfigBase();
			process.env.TEST_ENV_1 = 'soul_train';
			const response = config._interpolate('${TEST_ENV_1}', process.env);
			Assert(response === 'soul_train');
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

module.exports = InterpolatePassesUntypedAsStringTest;
