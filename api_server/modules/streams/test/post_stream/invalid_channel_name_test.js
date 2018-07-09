'use strict';

var PostChannelStreamTest = require('./post_channel_stream_test');

class InvalidChannelNameTest extends PostChannelStreamTest {

	get description () {
		return `should return an error when attempting to create a channel stream with a "${this.illegalCharacter}" in the name`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: [{
				name: 'invalid channel name'
			}]
		};
	}

	// before the test runs...
	before (callback) {
		// set up standard test conditions for creating a channel stream, 
		// but use an illegal character in the channel name
		super.before(error => {
			if (error) { return callback(error); }
			this.data.name = `ill${this.illegalCharacter}egal`;
			callback();
		});
	}
}

module.exports = InvalidChannelNameTest;
