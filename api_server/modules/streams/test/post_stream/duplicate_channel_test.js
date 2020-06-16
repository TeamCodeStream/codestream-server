'use strict';

const PostChannelStreamTest = require('./post_channel_stream_test');

class DuplicateChannelTest extends PostChannelStreamTest {

	constructor (options) {
		super(options);
		this.wantDuplicateStream = true;	// indicates to create a duplicate stream before the actual test runs
	}

	get description () {
		return 'should return an error when trying to create a channel stream with a name that is already taken';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1004',
		};
	}

	// before the test runs...
	before (callback) {
		// run the standard test setup for creating a channel stream...
		super.before(error => {
			if (error) { return callback(error); }
			// ...and give our test stream the same name, this causes an error
			this.data.name = this.duplicateStream.name;
			callback();
		});
	}
}

module.exports = DuplicateChannelTest;
