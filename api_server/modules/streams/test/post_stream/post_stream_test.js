// provide a base class for many of the tests of the "POST /streams" request to create a stream
'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const StreamTestConstants = require('../stream_test_constants');
const CommonInit = require('./common_init');

class PostStreamTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get method () {
		return 'post';
	}

	get path () {
		return '/streams';
	}

	get description () {
		return `should return a valid stream when creating a new ${this.type} stream`;
	}

	getExpectedFields () {
		return StreamTestConstants.EXPECTED_STREAM_RESPONSE;
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		const stream = data.stream;
		const errors = [];
		const result = (
			((stream.id === stream._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((stream.type === this.data.type) || errors.push('type does not match')) &&
			((stream.teamId === this.data.teamId) || errors.push('teamId does not match')) &&
			((stream.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof stream.createdAt === 'number') || errors.push('createdAt not number')) &&
			((stream.modifiedAt >= stream.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((stream.creatorId === this.currentUser.user.id) || errors.push('creatorId not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		this.validateSanitized(stream, StreamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PostStreamTest;
