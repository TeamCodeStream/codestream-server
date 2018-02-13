'use strict';

var GrantTest = require('./grant_test');

class TeamChannelGrantTest extends GrantTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;	// we want a second registered user
		this.wantRepo = true;		// we want a repo and team
	}

	get description () {
		return 'should succeed when requesting to grant access to a team channel when i am a member of the team';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// set to grant access to the channel for the team the current user is a member of
		this.path = '/grant/team-' + this.team._id;
		callback();
	}
}

module.exports = TeamChannelGrantTest;
