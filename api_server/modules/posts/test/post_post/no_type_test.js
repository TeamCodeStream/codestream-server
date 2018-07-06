'use strict';

var DirectOnTheFlyTest = require('./direct_on_the_fly_test');

class NoTypeTest extends DirectOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post and creating a stream on the fly with no type';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'type'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the type for the stream we are trying to create on-the-fly
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.stream.type;
			callback();
		});
	}
}

module.exports = NoTypeTest;
