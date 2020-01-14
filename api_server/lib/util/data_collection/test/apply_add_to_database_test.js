'use strict';

const UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyAddToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying an add update and persisting';
	}

	async updateTestModel () {
		// add an element to the array, make sure it gets added
		const update = {
			array: 7
		};
		this.expectedOp = {
			'$addToSet': update
		};

		this.actualOp = await this.data.test.applyOpById(
			this.testModel.id,
			this.expectedOp
		);
		this.testModel.attributes.array.push(7);
	}
}

module.exports = ApplyAddToDatabaseTest;
