'use strict';

const AssignNRObjectTest = require('./assign_nr_object_test');

class CreatorEmailRequiredTest extends AssignNRObjectTest {

	get description () {
		return `should return an error when trying to assign a user to a New Relic object with no email for the creator`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'creator.email'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.creator.email;
			callback();
		});
	}
}

module.exports = CreatorEmailRequiredTest;
