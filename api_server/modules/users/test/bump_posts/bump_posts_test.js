'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');

class BumpPostsTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should increment totalPosts for the user when requested';
	}

	get method () { 
		return 'put';
	}
	
	// before the test runs...
	before (callback) {
		this.init(error => {
			if (error) { return callback(error); }
			this.path = '/bump-posts';
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepEqual(data, this.expectedData, 'response is incorrect');
	}
}

module.exports = BumpPostsTest;
