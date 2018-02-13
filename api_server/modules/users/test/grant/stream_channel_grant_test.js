'use strict';

var GrantTest = require('./grant_test');

class StreamChannelGrantTest extends GrantTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;	// we want a second registered user
		this.wantRepo = true;		// we want a repo and team
		this.wantStream = true;		// we want a stream in that team
	}

	get description () {
		return 'should succeed when requesting to grant access to a stream channel when i am a member of the stream';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// set to grant access to the channel for a stream that the current user is a member of
		this.path = '/grant/stream-' + this.stream._id;
		callback();
	}
}

module.exports = StreamChannelGrantTest;
