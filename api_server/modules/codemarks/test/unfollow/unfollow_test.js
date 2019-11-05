'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class UnfollowTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
		this.expectedVersion = 3;
	}

	get description () {
		return 'should return directives to update a codemark when unfollowing a codemark';
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
		// verify modifiedAt was updated, and then set it so the deepEqual works
		const codemark = data.codemark;
		Assert(codemark.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the before was updated');
		this.expectedResponse.codemark.$set.modifiedAt = codemark.$set.modifiedAt;
		Assert.deepEqual(data, this.expectedResponse, 'response data is not correct');
	}
}

module.exports = UnfollowTest;
