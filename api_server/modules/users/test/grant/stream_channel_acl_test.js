'use strict';

var GrantTest = require('./grant_test');

class StreamChannelACLTest extends GrantTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;
		this.wantForeignRepo = true;
		this.wantForeignStream = true;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	get description () {
		return 'should return an error when requesting to grant access to a stream channel when i am not a member of the team that owns the stream';
	}

	setPath (callback) {
		this.path = '/grant/stream-' + this.foreignStream._id;
		callback();
	}
}

module.exports = StreamChannelACLTest;
