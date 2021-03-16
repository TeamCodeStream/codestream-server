'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');

class ReadItemTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should set lastReadItems for an item when requested';
	}

	get method () { 
		return 'put';
	}
	
	// before the test runs...
	before (callback) {
		this.init(error => {
			if (error) { return callback(error); }
			this.path = '/read-item/' + this.itemId;
			this.updatedAt = Date.now();
			callback();
		});
	}

	validateResponse (data) {
		Assert(data.user.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		this.expectedData.user.$set.modifiedAt = data.user.$set.modifiedAt;
		Assert.deepStrictEqual(data, this.expectedData, 'response not correct');
	}
}

module.exports = ReadItemTest;
