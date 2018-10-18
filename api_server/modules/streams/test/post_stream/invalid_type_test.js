'use strict';

const PostChannelStreamTest = require('./post_channel_stream_test');

class InvalidTypeTest extends PostChannelStreamTest {

	get description () {
		return 'should return an error when attempting to create a stream of an invalid type';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: {
				code: 'STRM-1000'
			}
		};
	}

	// before the test runs...
	before (callback) {
		// set up standard test conditions for creating a channel stream, 
		// but set the type to a bogus type
		super.before(error => {
			if (error) { return callback(error); }
			this.data.type = 'sometype';
			callback();
		});
	}
}

module.exports = InvalidTypeTest;
