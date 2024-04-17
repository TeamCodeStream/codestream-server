'use strict';

const GetEntitiesTest = require('./get_entities_test');

class TeamIDRequiredTest extends GetEntitiesTest {

	get description () {
		return 'should return an error if teamId is not provided to a query for entities';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'teamId'
		};
	}

	setPath (callback) {
		this.path = '/entities'; // no teamId
		callback();
	}
}

module.exports = TeamIDRequiredTest;
