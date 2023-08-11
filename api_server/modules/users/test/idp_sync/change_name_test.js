'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class ChangeNameTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should change current user\'s name when a name change is discovered through IDP';
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/users/me';
	}

	// set mock data to use during the test
	makeMockData (callback) {
		this.data = {
			name: this.userFactory.randomFullName()
		};
		super.makeMockData(callback);
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.strictEqual(data.user.fullName, this.data.name, 'fetched user\'s name does not match');
	}
}

module.exports = ChangeNameTest;
