'use strict';

const ChannelOnTheFlyTest = require('./channel_on_the_fly_test');

class InvalidPrivacyTest extends ChannelOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post and creating a channel stream on the fly with an invalid privacy setting';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: {
				code: 'STRM-1007'
			}
		};
	}

	// before the test runs...
	before (callback) {
		// set bogus privacy used in the request
		// to create a channel stream on the fly with the post
		super.before(error => {
			if (error) { return callback(error); }
			this.data.stream.privacy = 'xyzabc';
			callback();
		});
	}
}

module.exports = InvalidPrivacyTest;
