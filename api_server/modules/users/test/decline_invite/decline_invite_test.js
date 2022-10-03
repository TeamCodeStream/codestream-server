// base class for many tests of the "PUT /decline-invite/:companyId" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class DeclineInviteTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should deactivate user record when declining an invite to join a company';
	}

	get method () {
		return 'put';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}
}

module.exports = DeclineInviteTest;
