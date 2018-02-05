'use strict';

var GrantTest = require('./grant_test');

class StreamChannelGrantTest extends GrantTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;
		this.wantRepo = true;
		this.wantStream = true;
	}

	get description () {
		return 'should succeed when requesting to grant access to a stream channel when i am a member of the stream';
	}

	setPath (callback) {
		this.path = '/grant/stream-' + this.stream._id;
		callback();
	}
}

module.exports = StreamChannelGrantTest;
