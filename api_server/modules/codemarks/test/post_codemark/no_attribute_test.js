'use strict';

const PostCodeMarkTest = require('./post_codemark_test');

class NoAttributeTest extends PostCodeMarkTest {

	get description () {
		return `should return an error when attempting to create an codemark with no ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// before the test runs...
	before (callback) {
		// delete the attribute when we try to create the codemark 
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;
