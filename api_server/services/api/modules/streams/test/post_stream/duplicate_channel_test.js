'use strict';

var PostChannelStreamTest = require('./post_channel_stream_test');

class DuplicateChannelTest extends PostChannelStreamTest {

	constructor (options) {
		super(options);
		this.testOptions.wantDuplicateStream = true;
	}

	get description () {
		return 'should return an error when trying to create a channel stream with a name that is already taken';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1004',
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.name = this.duplicateStream.name;
			callback();
		});
	}
}

module.exports = DuplicateChannelTest;
