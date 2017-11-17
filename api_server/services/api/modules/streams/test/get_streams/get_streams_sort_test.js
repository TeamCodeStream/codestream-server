'use strict';

var GetStreamsTest = require('./get_streams_test');

class GetStreamsSortTest extends GetStreamsTest {

	constructor (options) {
		super(options);
		this.dontDoForeign = true;
		this.dontDoTeamStreams = true;
	}

	get description () {
		return 'should return the correct streams in correct order when requesting streams in ascending order by sort ID';
	}

	setPath (callback) {
		this.myStreams = this.streamsByRepo[this.myRepo._id];
		this.path = `/streams/?teamId=${this.myTeam._id}&repoId=${this.myRepo._id}&sort=asc`;
		callback();
	}

	validateResponse (data) {
		this.validateSortedMatchingObjects(data.streams, this.myStreams, 'streams');
		super.validateResponse(data);
	}
}

module.exports = GetStreamsSortTest;
