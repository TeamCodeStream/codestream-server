'use strict';

const CodeMarkTest = require('./codemark_test');

class NoCodeMarkTypeTest extends CodeMarkTest {

	get description () {
		return 'should return error when attempting to create a post with an codemark with no type';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'type'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the type attribute when we try to create the codemark with the post
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.codemark.type;
			callback();
		});
	}
}

module.exports = NoCodeMarkTypeTest;
