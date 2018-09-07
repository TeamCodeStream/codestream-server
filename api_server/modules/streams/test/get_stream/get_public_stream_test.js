'use strict';

const GetOtherChannelStreamTest = require('./get_other_channel_stream_test');

class GetPublicStreamTest extends GetOtherChannelStreamTest {

	constructor (options) {
		super(options);
		this.withoutMeInStream = true;
		this.privacy = 'public';
	}
	get description () {
		return 'should return a valid stream when requesting a public channel stream that i am not a member of';
	}
}

module.exports = GetPublicStreamTest;
