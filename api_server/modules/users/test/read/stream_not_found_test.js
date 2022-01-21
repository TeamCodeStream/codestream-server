'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const ObjectId = require('mongodb').ObjectId;

class StreamNotFoundTest extends CodeStreamAPITest {

	get description () {
		return 'should return error when user attempts to mark a non-existent stream as read';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/read/' + ObjectId();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}
}

module.exports = StreamNotFoundTest;
