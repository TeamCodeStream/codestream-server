'use strict';

const GetCodeErrorsTest = require('./get_code_errors_test');

class TeamIDRequiredTest extends GetCodeErrorsTest {

	get description () {
		return 'should return error if teamId is not provided to code errors query';
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
