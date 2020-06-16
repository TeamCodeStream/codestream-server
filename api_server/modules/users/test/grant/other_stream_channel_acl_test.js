'use strict';

const GrantTest = require('./grant_test');

class OtherStreamChannelACLTest extends GrantTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;		// we want a second registered user
		this.wantTeam = true;			// we want a team for the test
		this.wantOtherStream = true;	// we want a stream in the team that the current user will not be a member of
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	get description () {
		return 'should return an error when requesting to grant access to a stream channel when i am not a member of the stream';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// set to grant access to the channel for a stream in the current user's team, but the current user 
		// is not a member of the stream
		this.path = '/grant/stream-' + this.otherStream.id;
		callback();
	}
}

module.exports = OtherStreamChannelACLTest;
