'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class UnreadTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should set lastReads for the stream of a post when post is marked as unread';
	}

	get method () { 
		return 'put';
	}
	
	// before the test runs...
	before (callback) {
		this.init(error => {
			if (error) { return callback(error); }
			const post = this.posts[this.unreadPost];
			this.path = '/unread/' + post._id;
			callback();
		});
	}
}

module.exports = UnreadTest;
