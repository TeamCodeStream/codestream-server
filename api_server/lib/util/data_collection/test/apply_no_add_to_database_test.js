'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyNoAddToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get an unchanged model after applying a no-op add update and persisting';
	}

	async updateTestModel (callback) {
		// this element is already in the array, so check that the document is not changed at all by this op
		const update = {
			array: 4
		};
		try {
			await this.data.test.applyOpById(
				this.testModel.id,
				{ '$addToSet': update }
			);
		}
		catch (error) {
			return callback(error);
		}
		callback();
	}
}

module.exports = ApplyNoAddToDatabaseTest;
