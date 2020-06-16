// base class for many tests of the "DELETE /codemarks/:id" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const CodemarkTestConstants = require('../codemark_test_constants');

class DeleteCodemarkTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the deactivated codemark and associated post when deleting a codemark';
	}

	get method () {
		return 'delete';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}
	
	// validate the response to the test request
	validateResponse (data) {
		const codemark = data.codemarks[0];
		const post = data.posts[0];
		// verify modifiedAt was updated, and then set it so the deepEqual works
		Assert(codemark.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt for the codemark is not greater than before the codemark was deleted');
		Assert(post.$set.modifiedAt >= this.modifiedAfter, 'codemark modifiedAt is not greater than before the post was deleted');
		this.expectedData.codemarks[0].$set.modifiedAt = codemark.$set.modifiedAt;
		this.expectedData.posts[0].$set.modifiedAt = post.$set.modifiedAt;
		// verify we got back the proper response
		Assert.deepEqual(data, this.expectedData, 'response data is not correct');
		// verify the post and codemark in the response has no attributes that should not go to clients
		this.validateSanitized(post.$set, CodemarkTestConstants.UNSANITIZED_POST_ATTRIBUTES);
		this.validateSanitized(codemark.$set, CodemarkTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = DeleteCodemarkTest;
