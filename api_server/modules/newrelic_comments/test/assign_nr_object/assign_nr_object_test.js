// base class for many tests of the "POST /nr-comments/assign" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class AssignNRObjectTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the expected response when a request is made to assign a New Relic object to a user';
	}

	get method () {
		return 'post';
	}

	// before the test runs...
	before (callback) {
		this.path = '/nr-comments/assign';
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepStrictEqual(data, {}, 'response should be an empty object');
	}
}

module.exports = AssignNRObjectTest;
