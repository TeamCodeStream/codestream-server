'use strict';

const GrantTest = require('./grant_test');

class TeamChannelACLTest extends GrantTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;		// we want a second registered user
		this.wantForeignTeam = true;	// we want a team that the current user is not a member of
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	get description () {
		return 'should return an error when requesting to grant access to a team channel when i am not a member of the team';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// set to grant access to the channel for a team that the current user is not a member of
		this.path = '/grant/team-' + this.foreignTeam._id;
		callback();
	}
}

module.exports = TeamChannelACLTest;
