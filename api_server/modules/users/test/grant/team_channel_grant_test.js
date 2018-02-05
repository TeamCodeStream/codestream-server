'use strict';

var GrantTest = require('./grant_test');

class TeamChannelGrantTest extends GrantTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;
		this.wantRepo = true;
	}

	get description () {
		return 'should succeed when requesting to grant access to a team channel when i am a member of the team';
	}

	setPath (callback) {
		this.path = '/grant/team-' + this.team._id;
		callback();
	}
}

module.exports = TeamChannelGrantTest;
