'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyIncToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying an increment update and persisting';
	}

	async updateTestModel (callback) {
		// increment a numeric field, make sure it gets incremented
		const update = {
			number: 5
		};
		try {
			await this.data.test.applyOpById(
				this.testModel.id,
				{ '$inc': update }
			);
		}
		catch (error) {
			return callback(error);
		}
		this.testModel.attributes.number += 5;
		callback();
	}
}

module.exports = ApplyIncToDatabaseTest;
