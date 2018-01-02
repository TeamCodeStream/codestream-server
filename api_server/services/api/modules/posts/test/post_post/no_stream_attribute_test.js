'use strict';

var DirectOnTheFlyTest = require('./direct_on_the_fly_test');

class NoStreamAttributeTest extends DirectOnTheFlyTest {

	get description () {
		return `should return an error when attempting to create a post and creating a direct stream on the fly with no ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// before the test runs...
	before (callback) {
		// from the stream object we use when trying to create a stream on the fly with a post,
		// delete the specified attribute
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.stream[this.attribute];
			callback();
		});
	}
}

module.exports = NoStreamAttributeTest;
