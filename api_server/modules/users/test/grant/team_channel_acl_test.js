'use strict';

var GrantTest = require('./grant_test');

class TeamChannelACLTest extends GrantTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;
		this.wantForeignRepo = true;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	get description () {
		return 'should return an error when requesting to grant access to a team channel when i am not a member of the team';
	}

	setPath (callback) {
		this.path = '/grant/team-' + this.foreignTeam._id;
		callback();
	}
}

module.exports = TeamChannelACLTest;
