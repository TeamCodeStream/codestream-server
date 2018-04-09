'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyPullToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying a pull update and persisting';
	}

	async updateTestModel (callback) {
		// pull this element from the array, and check that it's gone
		const update = {
			array: 4
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
		const index = this.testModel.attributes.array.indexOf(4);
		this.testModel.attributes.array.splice(index, 1);
		callback();
	}
}

module.exports = ApplyPullToDatabaseTest;
