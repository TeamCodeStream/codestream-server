'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyNoPullToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying a no-op pull update and persisting';
	}

	async updateTestModel (callback) {
		// this element is not in the array, so check that the document is not changed at all by this op
		const update = {
			array: 8
		};
		try {
			await this.data.test.applyOpById(
				this.testModel.id,
				{ '$pull': update }
			);
		}
		catch (error) {
			return callback(error);
		}
		callback();
	}
}

module.exports = ApplyNoPullToDatabaseTest;
