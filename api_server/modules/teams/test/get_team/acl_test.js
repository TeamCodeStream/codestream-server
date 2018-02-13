'use strict';

var GetTeamTest = require('./get_team_test');

class ACLTest extends GetTeamTest {

	constructor (options) {
		super(options);
		this.withoutMe = true;	// don't include "current user" in the "other" team
	}

	get description () {
		return 'should return an error when trying to fetch a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	// set the path to use when making the test request
	setPath (callback) {
		this.path = '/teams/' + this.otherTeam._id;	// fetch the "other" team, current user is not a member of this one
		callback();
	}
}

module.exports = ACLTest;
