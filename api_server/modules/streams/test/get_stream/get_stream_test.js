// provide base class for most tests testing the "GET /streams/:id" request

'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const StreamTestConstants = require('../stream_test_constants');

class GetStreamTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		const creatorIndex = this.mine ? 0 : 1;
		if (this.type === 'file') {
			this.repoOptions.creatorIndex = 1;
		} else if (this.type === 'object') {
			Object.assign(this.postOptions, {
				creatorIndex,
				wantCodeError: true,
				claimCodeErrors: true
			});
		}
	}

	get description () {
		const user = this.mine ? 'me' : 'another user on my team';
		return `should return a valid stream when requesting a ${this.type} stream created by ${user}`;
	}

	getExpectedFields () {
		const fieldsByType = {
			'file': StreamTestConstants.EXPECTED_FILE_STREAM_FIELDS,
			'direct': StreamTestConstants.EXPECTED_DIRECT_STREAM_FIELDS,
			'channel': StreamTestConstants.EXPECTED_CHANNEL_STREAM_FIELDS,
			'team stream': StreamTestConstants.EXPECTED_TEAM_STREAM_FIELDS,
			'object': StreamTestConstants.EXPECTED_OBJECT_STREAM_FIELDS
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
		if (this.type === 'file') {
			this.stream = this.repoStreams[0];
		} else if (this.type === 'team stream') {
			this.stream = this.teamStream;
		} else if (this.type === 'object') {
			this.stream = this.postData[0].streams.find(stream => stream.type === 'object');
		} else {
			throw `creating streams of type ${this.type} is deprecated`;
		}
		this.path = '/streams/' + this.stream.id;
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		// make sure we got back the stream we created, and make sure there are no attributes that should not be seen by clients
		this.validateMatchingObject(this.stream.id, data.stream, 'stream');
		this.validateSanitized(data.stream, StreamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetStreamTest;
