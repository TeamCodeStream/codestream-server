'use strict';

var PutTeamTest = require('./put_team_test');
var ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends PutTeamTest {

	get description () {
		return 'should return an error when trying to update a team that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/teams/' + ObjectID(); // substitute an ID for a non-existent team
			callback();
		});
	}
}

module.exports = TeamNotFoundTest;
