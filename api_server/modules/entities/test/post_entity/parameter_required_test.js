'use strict';

const PostEntityTest = require('./post_entity_test');

class ParameterRequiredTest extends PostEntityTest {

	get description () {
		return `should return an error when trying to create a New Relic entity with no ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data[this.parameter];
			callback();
		});
	}
}

module.exports = ParameterRequiredTest;
