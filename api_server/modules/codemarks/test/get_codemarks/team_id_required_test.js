'use strict';

const GetCodemarksTest = require('./get_codemarks_test');

class TeamIDRequiredTest extends GetCodemarksTest {

	get description () {
		return 'should return error if teamId is not provided to codemarks query';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'teamId'
		};
	}

	setPath (callback) {
		// no teamID in this path...
		this.path = '/codemarks';
		callback();
	}
}

module.exports = TeamIDRequiredTest;
