// provide base class for most tests testing the "GET /streams/:id" request

'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const StreamTestConstants = require('../stream_test_constants');

class GetStreamTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		Object.assign(this.streamOptions, {
			creatorIndex: 0,
			type: this.type
		});
		if (this.type === 'file') {
			this.repoOptions.creatorIndex = 0;
		}
	}

	get description () {
		return `should return a valid stream when requesting a ${this.type} stream created by me`;
	}

	getExpectedFields () {
		const fieldsByType = {
			'file': StreamTestConstants.EXPECTED_FILE_STREAM_FIELDS,
			'direct': StreamTestConstants.EXPECTED_DIRECT_STREAM_FIELDS,
			'channel': StreamTestConstants.EXPECTED_CHANNEL_STREAM_FIELDS
		};
		return { stream: [
			...StreamTestConstants.EXPECTED_STREAM_FIELDS,
			...fieldsByType[this.type]
		]};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath
		], callback);
	}

	// set the path to use when issuing the request
	setPath (callback) {
		this.path = '/streams/' + this.stream._id;
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		// make sure we got back the stream we created, and make sure there are no attributes that should not be seen by clients
		this.validateMatchingObject(this.stream._id, data.stream, 'stream');
		this.validateSanitized(data.stream, StreamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetStreamTest;
