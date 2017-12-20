'use strict';

var DirectOnTheFlyTest = require('./direct_on_the_fly_test');

class NoStreamAttributeTest extends DirectOnTheFlyTest {

	get description () {
		return `should return an error when attempting to create a post and creating a direct stream on the fly with no ${this.attribute}`;
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.stream[this.attribute];
			callback();
		});
	}
}

module.exports = NoStreamAttributeTest;
