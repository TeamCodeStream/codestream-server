// base class for many tests of the "PUT /users" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class PutUserTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
		this.attributes = this.attributes || ['username', 'fullName'];
	}

	get description () {
		return `should return the updated user when updating ${this.attributes.join(' and ')} for a user`;
	}

	get method () {
		return 'put';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert(data.user.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the user was updated');
		this.expectedData.user.$set.modifiedAt = data.user.$set.modifiedAt;
		Assert.deepEqual(data, this.expectedData, 'response is not correct');
	}
}

module.exports = PutUserTest;
