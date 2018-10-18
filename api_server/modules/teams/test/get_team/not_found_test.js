'use strict';

const GetTeamTest = require('./get_team_test');
const ObjectID = require('mongodb').ObjectID;

class NotFoundTest extends GetTeamTest {

	get description () {
		return 'should return an error when trying to fetch a team that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	// set the path to use when making the test request
	setPath (callback) {
		// try to get some random team that doesn't exist
		this.path = '/teams/' + ObjectID();
		callback();
	}
}

module.exports = NotFoundTest;
