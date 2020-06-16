'use strict';

const GrantTest = require('./grant_test');

class StreamChannelACLTest extends GrantTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;		// we want a second registered user
		this.wantForeignTeam = true;	// we want a team that the current user is not a member of
		this.wantForeignStream = true;	// we want a stream in that team
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	get description () {
		return 'should return an error when requesting to grant access to a stream channel when i am not a member of the team that owns the stream';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// set to grant access to the channel for a stream in the team that the current user is not a member of
		this.path = '/grant/stream-' + this.foreignStream.id;
		callback();
	}
}

module.exports = StreamChannelACLTest;
