'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class DeleteNRCommentTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should deactivate a New Relic comment when requested through the comment engine';
	}

	get method () {
		return 'delete';
	}

	before (callback) {
		this.init(callback);
	}

	// validate the request response
	validateResponse (data) {
		Assert(data.post.modifiedAt >= this.deletedAfter, 'modifiedAt not updated');
		this.expectedResponse.post.modifiedAt = data.post.modifiedAt;
		
		Assert.deepStrictEqual(data, this.expectedResponse, 'incorrect response');
	}
}

module.exports = DeleteNRCommentTest;
