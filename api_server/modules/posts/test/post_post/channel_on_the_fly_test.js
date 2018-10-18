'use strict';

const DirectOnTheFlyTest = require('./direct_on_the_fly_test');
const Assert = require('assert');

class ChannelOnTheFlyTest extends DirectOnTheFlyTest {

	constructor (options) {
		super(options);
		this.streamType = 'channel';
	}

	get description () {
		return 'should return a valid post and stream when creating a post and creating a channel stream on the fly';
	}

	// validate the request results
	validateStream (data) {
		// validate that the stream name matches the one requested
		const stream = data.streams[0];
		Assert(stream.name === this.data.stream.name, 'name does not match');
		// validate we got the right stream info
		super.validateStream(data);
	}
}

module.exports = ChannelOnTheFlyTest;
