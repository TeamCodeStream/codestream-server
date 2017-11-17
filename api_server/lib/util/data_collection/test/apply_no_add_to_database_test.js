'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyNoAddToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get an unchanged model after applying a no-op add update and persisting';
	}

	updateTestModel (callback) {
		const update = {
			array: 4
		};
		this.data.test.applyOpById(
			this.testModel.id,
			{ '$addToSet': update },
			callback
		);
	}
}

module.exports = ApplyNoAddToDatabaseTest;
