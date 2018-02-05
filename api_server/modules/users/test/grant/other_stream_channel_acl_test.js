'use strict';

var GrantTest = require('./grant_test');

class OtherStreamChannelACLTest extends GrantTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;
		this.wantRepo = true;
		this.wantOtherStream = true;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	get description () {
		return 'should return an error when requesting to grant access to a stream channel when i am not a member of the stream';
	}

	setPath (callback) {
		this.path = '/grant/stream-' + this.otherStream._id;
		callback();
	}
}

module.exports = OtherStreamChannelACLTest;
