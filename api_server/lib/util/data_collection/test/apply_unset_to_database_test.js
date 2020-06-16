'use strict';

const UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyUnsetToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying an unset update and persisting';
	}

	async updateTestModel () {
		// unset a value and verify it is unset
		const unset = {
			text: 1,
		};
		this.expectedOp = {
			'$unset': unset
		};

		this.actualOp = await this.data.test.applyOpById(
			this.testModel.id,
			this.expectedOp
		);
		delete this.testModel.attributes.text;
	}
}

module.exports = ApplyUnsetToDatabaseTest;
