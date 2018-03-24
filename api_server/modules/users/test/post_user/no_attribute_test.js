'use strict';

const PostUserTest = require('./post_user_test');

class NoAttributeTest extends PostUserTest {

	get description () {
		return `should return error when attempting to create a user with no ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// delete the specified attribute from the data to use in the request
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;
