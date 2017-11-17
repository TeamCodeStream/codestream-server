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

	setPath (callback) {
		this.myStreams = this.streamsByRepo[this.myRepo._id];
		this.myStreams.splice(0, this.numStreams - 3);
		this.path = `/streams/?teamId=${this.myTeam._id}&repoId=${this.myRepo._id}&limit=3`;
		callback();
	}
}

module.exports = GetStreamsLimitTest;
