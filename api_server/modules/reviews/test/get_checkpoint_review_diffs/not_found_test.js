'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const ObjectId = require('mongodb').ObjectId;

class NotFoundTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when trying to fetch checkpoint diffs for a review that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// try to get a bogus review, with an ID that doesn't exist
			this.path = '/reviews/checkpoint-diffs/' + ObjectId();
			callback();
		});
	}
}

module.exports = NotFoundTest;
