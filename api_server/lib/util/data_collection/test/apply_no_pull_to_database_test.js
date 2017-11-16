'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyNoPullToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying a no-op pull update and persisting';
	}

	updateTestModel (callback) {
		const update = {
			array: 8
		};
		this.data.test.applyOpById(
			this.testModel.id,
			{ pull: update },
			callback
		);
	}
}

module.exports = ApplyNoPullToDatabaseTest;
