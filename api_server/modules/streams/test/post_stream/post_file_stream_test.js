'use strict';

var Assert = require('assert');
var PostStreamTest = require('./post_stream_test');
const StreamTestConstants = require('../stream_test_constants');

class PostFileStreamTest extends PostStreamTest {

	constructor (options) {
		super(options);
		this.type = 'file';
	}

	getExpectedFields () {
		// expect standard stream fields, plus stream fields for a file-type stream
		let fields = Object.assign({}, super.getExpectedFields());
		fields.stream = [
			...fields.stream,
			...StreamTestConstants.EXPECTED_FILE_STREAM_FIELDS
		];
		return fields;
	}

	// make options to use when creating the stream for the test
	makeStreamOptions (callback) {
		// get the standard stream options, and add the repo ID, required for file-type stream
		super.makeStreamOptions(() => {
			this.streamOptions.repoId = this.repo._id;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		let stream = data.stream;
		let errors = [];
		let result = (
			((stream.repoId === this.data.repoId) || errors.push('repoId does not match')) &&
			((stream.file === this.data.file) || errors.push('file does not match'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		super.validateResponse(data);
	}
}

module.exports = PostFileStreamTest;
