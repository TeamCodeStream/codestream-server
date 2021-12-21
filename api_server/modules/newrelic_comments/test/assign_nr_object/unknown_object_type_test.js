'use strict';

const AssignNRObjectTest = require('./assign_nr_object_test');

class UnknownObjectTypeTest extends AssignNRObjectTest {

	get description () {
		return `should return an error when trying to assign a user to a New Relic object but providing an unknown object type`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'objectType is not an accepted code error type'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.objectType = 'unknown';
			callback();
		});
	}
}

module.exports = UnknownObjectTypeTest;
