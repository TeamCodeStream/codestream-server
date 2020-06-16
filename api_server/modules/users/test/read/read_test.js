'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const CommonInit = require('./common_init');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');

class ReadTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should clear lastReads for the specified stream ID for the current user ';
	}

	get method () { 
		return 'put';
	}
	
	// before the test runs...
	before (callback) {
		this.init(error => {
			if (error) { return callback(error); }
			this.path = '/read/' + this.stream.id;
			callback();
		});
	}

	validateResponse (data) {
		Assert.deepEqual(data, this.expectedData, 'response not correct');
	}
}

module.exports = ReadTest;
