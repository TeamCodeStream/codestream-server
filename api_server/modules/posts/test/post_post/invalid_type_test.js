'use strict';

const DirectOnTheFlyTest = require('./direct_on_the_fly_test');

class InvalidTypeTest extends DirectOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post and creating a stream on the fly with an invalid type';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: {
				code: 'STRM-1000'
			}
		};
	}

	// before the test runs...
	before (callback) {
		// substitute an unrecognized type for the stream we are trying to create on-the-fly
		super.before(error => {
			if (error) { return callback(error); }
			this.data.stream.type = 'sometype';
			callback();
		});
	}
}

module.exports = InvalidTypeTest;
