'use strict';

var GetStreamsTest = require('./get_streams_test');

class ACLTest extends GetStreamsTest {

	get description () {
		return 'should return an error when trying to fetch streams from a team i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// try to fetch a few of the streams from the "foreign" team, which we are not a member of
		let teamId = this.foreignTeam._id;
		let streams = [
			this.streamsByTeam[this.foreignTeam._id][0],
			this.streamsByRepo[this.foreignRepo._id][1],
		];
		let ids = streams.map(stream => stream._id);
		this.path = `/streams?teamId=${teamId}&ids=${ids}`;
		callback();
	}
}

module.exports = ACLTest;
