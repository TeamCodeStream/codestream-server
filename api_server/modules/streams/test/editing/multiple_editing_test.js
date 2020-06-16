'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const MultipleCommonInit = require('./multiple_common_init');

class MultipleEditingTest extends Aggregation(CodeStreamAPITest, MultipleCommonInit) {

	get description () {
		return 'should return the correct set of ops when user sends a complete list of files they are editing';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/editing';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		this.confirmResponse(data);
	}
}

module.exports = MultipleEditingTest;
