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

	setPath (callback) {
		this.myStreams = this.streamsByRepo[this.myRepo._id];
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
