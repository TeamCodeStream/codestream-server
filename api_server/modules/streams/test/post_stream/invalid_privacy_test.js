'use strict';

var PostChannelStreamTest = require('./post_channel_stream_test');

class InvalidPrivacyTest extends PostChannelStreamTest {

	get description () {
		return 'should return an error when attempting to create a channel stream with an invalid privacy type';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'STRM-1007'
			}]
		};
	}

	// before the test runs...
	before (callback) {
		// set up standard test conditions for creating a channel stream, 
		// but set the privacy to a bogus setting
		super.before(error => {
			if (error) { return callback(error); }
			this.data.privacy = 'sometype';
			callback();
		});
	}
}

module.exports = InvalidPrivacyTest;
