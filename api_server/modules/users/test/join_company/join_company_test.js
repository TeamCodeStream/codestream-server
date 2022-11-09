// base class for many tests of the "PUT /join-company/:companyId" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class JoinCompanyTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		const by = this.byDomainJoining ? 'domain joining' : 'invite';
		return `should return user credentials when joining a company by ${by}`;
	}

	get method () {
		return 'put';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}
}

module.exports = JoinCompanyTest;
