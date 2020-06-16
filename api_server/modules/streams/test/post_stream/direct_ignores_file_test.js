'use strict';

const PostDirectStreamTest = require('./post_direct_stream_test');
const Assert = require('assert');

class DirectIgnoresFileTest extends PostDirectStreamTest {

	get description () {
		return 'should return a valid stream and ignore file-related attributes when creating a direct stream';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 0;
			callback();
		});
	}

	// before the test runs...
	before (callback) {
		// run standard setup for creating a direct stream...
		super.before(error => {
			if (error) { return callback(error); }
			// ...and add some file-type attributes, these should be ignored
			this.data.file = this.streamFactory.randomFile();
			this.data.repoId = this.repo._id;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// even though we added a file and repo ID, we should not see these in the response, since we created
		// a channel-type stream
		const stream = data.stream;
		Assert(typeof stream.file === 'undefined', 'file should be undefined');
		Assert(typeof stream.repoId === 'undefined', 'repoId should be undefined');
		super.validateResponse(data);
	}
}

module.exports = DirectIgnoresFileTest;
