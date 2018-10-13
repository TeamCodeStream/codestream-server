'use strict';

var GetStreamsTest = require('./get_streams_test');

class GetStreamsSortTest extends GetStreamsTest {

	constructor (options) {
		super(options);
		this.dontDoForeign = true;
		this.dontDoDirectStreams = true;
		this.dontDoFileStreams = true;
		delete this.repoOptions.creatorIndex;
	}

	get description () {
		return 'should return the correct streams in correct order when requesting streams in ascending order by sort ID';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// put the streams we expect in ascending order by ID, this is the order we expect in the response
		this.expectedStreams = this.streamsByTeam[this.team._id].filter(stream => {
			return stream.memberIds.includes(this.currentUser.user._id);
		});
		this.expectedStreams.push(this.teamStream);
		this.expectedStreams.sort((a, b) => {
			return a._id.localeCompare(b._id);
		});
		this.path = `/streams/?teamId=${this.team._id}&sort=asc`;
		callback();
	}

	validateResponse (data) {
		this.validateSortedMatchingObjects(data.streams, this.expectedStreams, 'streams');
		super.validateResponse(data);
	}
}

module.exports = GetStreamsSortTest;
