'use strict';

const GetStreamsTest = require('./get_streams_test');

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
		const teamId = this.foreignTeamResponse.team.id;
		const streams = [
			this.foreignStreamResponse.postData[1].streams[0],
			this.foreignStreamResponse.postData[5].streams[0]
		];
		const ids = streams.map(stream => stream.id);
		this.path = `/streams?teamId=${teamId}&ids=${ids}`;
		callback();
	}
}

module.exports = ACLTest;
