'use strict';

var GetMarkersTest = require('./get_markers_test');

class InvalidParameterTest extends GetMarkersTest {

	get description () {
		return 'should return an error if an unknown query parameter is provided';
	}

	setPath (callback) {
		this.path = `/markers?teamId=${this.team._id}&streamId=${this.stream._id}&commitHash=${this.commitHash}&thisparam=1`;
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid query parameter'
		};
	}
}

module.exports = InvalidParameterTest;
