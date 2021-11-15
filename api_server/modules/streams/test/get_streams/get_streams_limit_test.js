'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetStreamsLimitTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting a limited number of streams';
	}

	setTestOptions (callback) {
		this.dontDoForeign = true;
		//this.dontDoDirectStreams = true;
		this.dontDoFileStreams = true;
		super.setTestOptions(callback);
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		this.expectedStreams = this.getExpectedStreams();
		this.expectedStreams.sort((a, b) => {
			return b.id.localeCompare(a.id);
		});
		this.expectedStreams.splice(3);
		this.path = `/streams?teamId=${this.team.id}&limit=3`;
		callback();
	}
}

module.exports = GetStreamsLimitTest;
