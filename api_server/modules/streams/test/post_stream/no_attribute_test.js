'use strict';

const PostChannelStreamTest = require('./post_channel_stream_test');

class NoAttributeTest extends PostChannelStreamTest {

	get description () {
		return `should return error when attempting to create a stream with no ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// before the test runs...
	before (callback) {
		// run the standard test set up for posting a channel stream, but...
		super.before(error => {
			if (error) { return callback(error); }
			// ...delete the attribute of interest
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;
