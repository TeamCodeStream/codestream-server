'use strict';

var GetStreamsTest = require('./get_streams_test');

class GetStreamsLimitTest extends GetStreamsTest {

	constructor (options) {
		super(options);
		this.dontDoForeign = true;
		this.dontDoTeamStreams = true;
		this.numStreams = 10;
	}

	get description () {
		return 'should return the correct streams when requesting a limited number of streams';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// set up our expected streams to be in sorted order, and then limit to the first 3
		this.myStreams = this.streamsByRepo[this.myRepo._id];
		this.myStreams.sort((a, b) => {
			return a._id.localeCompare(b._id);
		});
		this.myStreams.splice(0, this.numStreams - 3);
		this.path = `/streams/?teamId=${this.myTeam._id}&repoId=${this.myRepo._id}&limit=3`;
		callback();
	}
}

module.exports = GetStreamsLimitTest;
