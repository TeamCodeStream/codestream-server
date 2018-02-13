'use strict';

var GetStreamsTest = require('./get_streams_test');

class GetStreamsDefaultSortTest extends GetStreamsTest {

	constructor (options) {
		super(options);
		this.dontDoForeign = true;
		this.dontDoTeamStreams = true;
	}

	get description () {
		return 'should return the correct streams in descending order when requesting streams in default sort order';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// default sort order for streams without posts is by their ID, in descending order
		this.myStreams = this.streamsByRepo[this.myRepo._id];
		this.myStreams.sort((a, b) => {
			return a._id.localeCompare(b._id);
		});
		this.myStreams.reverse();
		this.path = `/streams/?teamId=${this.myTeam._id}&repoId=${this.myRepo._id}`;
		callback();
	}

	validateResponse (data) {
		this.validateSortedMatchingObjects(data.streams, this.myStreams, 'streams');
		super.validateResponse(data);
	}
}

module.exports = GetStreamsDefaultSortTest;
