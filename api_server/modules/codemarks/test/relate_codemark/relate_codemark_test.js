'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class RelateCodemarkTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return directives to update the two codemarks when relating a codemark to another';
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
		for (let i = 0; i < 2; i++) {
			const codemark = data.codemarks[i];
			// verify modifiedAt was updated, and then set it so the deepEqual works
			Assert(codemark.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the before was updated');
			const expectedCodemark = this.expectedResponse.codemarks.find(exp => exp.id === codemark.id);
			expectedCodemark.$set.modifiedAt = codemark.$set.modifiedAt;
		}
		Assert.deepEqual(data, this.expectedResponse, 'response data is not correct');
	}
}

module.exports = RelateCodemarkTest;
