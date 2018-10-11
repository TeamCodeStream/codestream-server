'use strict';

const GetTeamsTest = require('./get_teams_test');

class IDsRequiredTest extends GetTeamsTest {

	get description () {
		return 'should return error if IDs are not provided to teams query';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'ids'
		};
	}

	// can't just GET /teams, need to specify IDs or "mine"
	setPath (callback) {
		this.path = '/teams';
		callback();
	}
}

module.exports = IDsRequiredTest;
