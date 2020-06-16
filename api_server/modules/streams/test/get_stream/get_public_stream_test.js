'use strict';

const GetOtherStreamTest = require('./get_other_stream_test');

class GetPublicStreamTest extends GetOtherStreamTest {

	constructor (options) {
		super(options);
		Object.assign(this.streamOptions, {
			type: 'channel',
			privacy: 'public',
			members: []
		});
	}

	get description () {
		return 'should return a valid stream when requesting a public channel stream that i am not a member of';
	}
}

module.exports = GetPublicStreamTest;
