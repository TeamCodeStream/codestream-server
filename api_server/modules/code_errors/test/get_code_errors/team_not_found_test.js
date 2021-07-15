'use strict';

const GetCodeErrorsTest = require('./get_code_errors_test');
const ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends GetCodeErrorsTest {

	get description () {
		return 'should return an error when trying to fetch code errors from a team that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009',
			reason: 'user not on team'
		};
	}

	setPath (callback) {
		// set teamId to team that doesn't exist
		this.path = '/code-errors?teamId=' + ObjectID();
		callback();
	}
}

module.exports = TeamNotFoundTest;
