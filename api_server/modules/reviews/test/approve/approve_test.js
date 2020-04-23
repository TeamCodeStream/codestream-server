'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class ApproveTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
		this.expectedVersion = 2;
	}

	get description () {
		return 'should return directives to update a review when approving a review';
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
		const review = data.review;
		const key = `approvedBy.${this.currentUser.user.id}`;
		Assert(review.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the review was updated');
		this.expectedResponse.review.$set.modifiedAt = review.$set.modifiedAt;
		Assert(review.$set[key].approvedAt >= this.modifiedAfter, 'approvedAt is not greater than before the review was updated');
		this.expectedResponse.review.$set[key].approvedAt = review.$set[key].approvedAt;
		Assert.deepEqual(data, this.expectedResponse, 'response data is not correct');
	}
}

module.exports = ApproveTest;
