'use strict';

const GetStreamsTest = require('./get_streams_test');

class TeamIDRequiredTest extends GetStreamsTest {

	get description () {
		return 'should return error if teamId is not provided to streams query';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'teamId'
		};
	}

	setPath (callback) {
		this.path = '/streams';
		callback();
	}
}

module.exports = TeamIDRequiredTest;
