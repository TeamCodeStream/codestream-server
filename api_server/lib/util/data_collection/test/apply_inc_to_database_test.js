'use strict';

const UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyIncToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying an increment update and persisting';
	}

	async updateTestModel () {
		// increment a numeric field, make sure it gets incremented
		const update = {
			number: 5
		};
		this.expectedOp = {
			'$inc': update
		};

		this.actualOp = await this.data.test.applyOpById(
			this.testModel.id,
			this.expectedOp
		);
		this.testModel.attributes.number += 5;
	}
}

module.exports = ApplyIncToDatabaseTest;
