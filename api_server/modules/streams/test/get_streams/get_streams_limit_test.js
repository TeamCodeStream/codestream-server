'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetStreamsLimitTest extends GetStreamsTest {

	constructor (options) {
		super(options);
		this.dontDoForeign = true;
		this.dontDoDirectStreams = true;
		this.dontDoFileStreams = true;
		delete this.repoOptions.creatorIndex;
		this.numStreams = 10;
	}

	get description () {
		return 'should return the correct streams when requesting a limited number of streams';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// set up our expected streams to be in sorted order, and then limit to the first 3
		this.expectedStreams = this.streamsByTeam[this.team.id].filter(stream => {
			return stream.memberIds.includes(this.currentUser.user.id);
		});
		this.expectedStreams.push(this.teamStream);
		this.expectedStreams.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		this.expectedStreams.splice(0, this.numStreams + 1 - 3);
		this.path = `/streams/?teamId=${this.team.id}&&limit=3`;
		callback();
	}
}

module.exports = GetStreamsLimitTest;
