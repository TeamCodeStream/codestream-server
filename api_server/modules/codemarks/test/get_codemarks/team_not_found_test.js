'use strict';

const GetCodemarksTest = require('./get_codemarks_test');
const ObjectId = require('mongodb').ObjectId;

class TeamNotFoundTest extends GetCodemarksTest {

	get description () {
		return 'should return an error when trying to fetch codemarks from a team that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009',
			reason: 'user not on team'
		};
	}

	setPath (callback) {
		// set teamId to team that doesn't exist
		this.path = '/codemarks?teamId=' + ObjectId();
		callback();
	}
}

module.exports = TeamNotFoundTest;
