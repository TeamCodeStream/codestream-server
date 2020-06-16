'use strict';

const PostFileStreamTest = require('./post_file_stream_test');
const Assert = require('assert');

class FileIgnoresChannelTest extends PostFileStreamTest {

	get description () {
		return 'should return a valid stream and ignore channel-related attributes when creating a file stream';
	}

	// before the test runs...
	before (callback) {
		// run standard setup for creating a file-type stream...
		super.before(error => {
			if (error) { return callback(error); }
			// ...and add some channel-type attributes, these should be ignored
			this.data.name = this.streamFactory.randomName();
			this.data.memberIds = this.users.splice(1, 3).map(user => user.id);
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// even though we added a name and member IDs, we should not see these in the response, since we created
		// a file-type stream
		const stream = data.stream;
		Assert(typeof stream.name === 'undefined', 'name should be undefined');
		Assert(typeof stream.memberIds === 'undefined', 'memberIds should be undefined');
		super.validateResponse(data);
	}
}

module.exports = FileIgnoresChannelTest;
