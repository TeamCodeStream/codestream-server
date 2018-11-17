'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetStreamsDefaultSortTest extends GetStreamsTest {

	constructor (options) {
		super(options);
		this.dontDoForeign = true;
		this.dontDoFileStreams = true;
		this.dontDoDirectStreams = true;
		delete this.repoOptions.creatorIndex;
	}

	get description () {
		return 'should return the correct streams in descending order when requesting streams in default sort order';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// default sort order for streams without posts is by their ID, in descending order
		this.expectedStreams = this.streamsByTeam[this.team.id].filter(stream => {
			return stream.memberIds.includes(this.currentUser.user.id);
		});
		this.expectedStreams.push(this.teamStream);
		this.expectedStreams.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		this.expectedStreams.reverse();
		this.path = `/streams/?teamId=${this.team.id}`;
		callback();
	}

	validateResponse (data) {
		this.validateSortedMatchingObjects(data.streams, this.expectedStreams, 'streams');
		super.validateResponse(data);
	}
}

module.exports = GetStreamsDefaultSortTest;
