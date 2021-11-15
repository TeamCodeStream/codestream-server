'use strict';

var GetStreamsTest = require('./get_streams_test');

class GetStreamsSortTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams in correct order when requesting streams in ascending order by sort ID';
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
			return a.id.localeCompare(b.id);
		});
		this.path = `/streams?teamId=${this.team.id}&sort=asc`;
		callback();
	}

	validateResponse (data) {
		this.expectedStreams.forEach(stream => { delete stream.post });
		this.validateSortedMatchingObjects(data.streams, this.expectedStreams, 'streams');
		super.validateResponse(data);
	}
}

module.exports = GetStreamsSortTest;
