'use strict';

const GetStreamsTest = require('./get_streams_test');

class InvalidTypeTest extends GetStreamsTest {

	get description () {
		return 'should return error if an invalid type is provided in the query';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid stream type'
		};
	}

	setPath (callback) {
		this.path = `/streams?teamId=${this.team._id}&type=sometype`;
		callback();
	}
}

module.exports = InvalidTypeTest;
