'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetStreamsDefaultSortTest extends GetStreamsTest {

	constructor (options) {
		super(options);
	}

	get description () {
		return 'should return the correct streams in descending order when requesting streams in default sort order';
	}

	setTestOptions (callback) {
		this.dontDoForeign = true;
		this.dontDoFileStreams = true;
		//this.dontDoDirectStreams = true;
		super.setTestOptions(callback);
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		this.expectedStreams = this.getExpectedStreams();

		// default sort order for streams without posts is by their ID, in descending order
		this.expectedStreams.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		this.expectedStreams.reverse();
		this.path = `/streams?teamId=${this.team.id}`;
		callback();
	}

	validateResponse (data) {
		this.expectedStreams.forEach(stream => { delete stream.post });
		this.validateSortedMatchingObjects(data.streams, this.expectedStreams, 'streams');
		super.validateResponse(data);
	}
}

module.exports = GetStreamsDefaultSortTest;
