'use strict';

const AssignNRObjectTest = require('./assign_nr_object_test');
const RandomString = require('randomstring');

class InvalidCreatorEmailTest extends AssignNRObjectTest {

	get description () {
		return `should return an error when trying to assign a user to a New Relic object with an invalid email for the creator`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid email'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.creator.email = RandomString.generate(10);
			callback();
		});
	}
}

module.exports = InvalidCreatorEmailTest;
