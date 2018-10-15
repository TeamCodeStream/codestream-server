'use strict';

const PostFileStreamTest = require('./post_file_stream_test');
const Assert = require('assert');

class FileStreamIgnoresPrivacyTest extends PostFileStreamTest {

	get description () {
		return 'should return a valid stream and ignore the privacy attribute when creating a file stream';
	}

	// before the test runs...
	before (callback) {
		// run standard setup for creating a file stream...
		super.before(error => {
			if (error) { return callback(error); }
			// ...and add a "private" privacy setting, which should be ignored
			this.data.privacy = 'private';
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// we should still see that privacy is public
		const stream = data.stream;
		Assert(stream.privacy === 'public', 'privacy should be public');
		super.validateResponse(data);
	}
}

module.exports = FileStreamIgnoresPrivacyTest;
