'use strict';

const PostDirectStreamTest = require('./post_direct_stream_test');

class TeamStreamMustBeChannelTest extends PostDirectStreamTest {

	get description () {
		return 'should return an error when attempting to create a team stream that is not a channel';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: {
				code: 'STRM-1006'
			}
		};
	}

	// before the test runs...
	before (callback) {
		// set up standard test conditions for creating a direct stream, but add isTeamStream flag
		super.before(error => {
			if (error) { return callback(error); }
			this.data.isTeamStream = true;
			callback();
		});
	}
}

module.exports = TeamStreamMustBeChannelTest;
