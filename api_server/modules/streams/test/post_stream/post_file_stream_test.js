'use strict';

const Assert = require('assert');
const PostStreamTest = require('./post_stream_test');
const StreamTestConstants = require('../stream_test_constants');

class PostFileStreamTest extends PostStreamTest {

	constructor (options) {
		super(options);
		this.type = 'file';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 0;
			callback();
		});
	}

	getExpectedFields () {
		// expect standard stream fields, plus stream fields for a file-type stream
		const fields = Object.assign({}, super.getExpectedFields());
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
			this.postStreamOptions.repoId = this.repo.id;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		const stream = data.stream;
		const errors = [];
		const result = (
			((stream.repoId === this.data.repoId) || errors.push('repoId does not match')) &&
			((stream.file === this.data.file) || errors.push('file does not match'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		super.validateResponse(data);
	}
}

module.exports = PostFileStreamTest;
