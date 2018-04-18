'use strict';

var DirectOnTheFlyTest = require('./direct_on_the_fly_test');

class TeamStreamMustBeChannelTest extends DirectOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post and creating a team stream on the fly that is not a channel';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'STRM-1006'
			}]
		};
	}

	// before the test runs...
	before (callback) {
        // add isTeamStream flag
		super.before(error => {
            if (error) { return callback(error); }
            this.data.stream.isTeamStream = true;
			callback();
		});
	}
}

module.exports = TeamStreamMustBeChannelTest;
