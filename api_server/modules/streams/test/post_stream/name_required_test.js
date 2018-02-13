'use strict';

var PostChannelStreamTest = require('./post_channel_stream_test');

class NameRequiredTest extends PostChannelStreamTest {

	get description () {
		return 'should return an error when attempting to create a channel stream with no name';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'STRM-1001'
			}]
		};
	}

	// before the test runs...
	before (callback) {
		// set up standard test conditions for creating a channel stream, but remove the name, which is required
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.name;
			callback();
		});
	}
}

module.exports = NameRequiredTest;
