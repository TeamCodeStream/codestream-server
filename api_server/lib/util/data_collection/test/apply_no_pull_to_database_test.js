'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyNoPullToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying a no-op pull update and persisting';
	}

	updateTestModel (callback) {
		// this element is not in the array, so check that the document is not changed at all by this op
		const update = {
			array: 8
		};
		this.data.test.applyOpById(
			this.testModel.id,
			{ '$pull': update },
			callback
		);
	}
}

module.exports = ApplyNoPullToDatabaseTest;
