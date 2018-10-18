'use strict';

const GetReposTest = require('./get_repos_test');

class TeamIDRequiredTest extends GetReposTest {

	get description () {
		return 'should return error if teamId is not provided to repos query';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'teamId'
		};
	}

	setPath (callback) {
		this.path = '/repos'; // no teamId
		callback();
	}
}

module.exports = TeamIDRequiredTest;
