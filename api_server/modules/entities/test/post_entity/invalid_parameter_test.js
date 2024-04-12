'use strict';

const PostEntityTest = require('./post_entity_test');

class InvalidParameterTest extends PostEntityTest {

	get description () {
		return `should return an error when trying to create a New Relic entity with an invalid ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			info: this.parameter
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data[this.parameter] = Math.floor(Math.random() * 100000000);
			callback();
		});
	}
}

module.exports = InvalidParameterTest;
