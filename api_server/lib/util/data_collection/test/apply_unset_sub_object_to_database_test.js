'use strict';

const UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyUnsetSubObjectToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying a sub-object unset to a model and persisting';
	}

	async updateTestModel () {
		// selectively unset some values in the object, and verify they are unset
		const unset = {
			'object.y': true
		};
		this.expectedOp = {
			'$unset': unset
		};
		
		this.actualOp = await this.data.test.applyOpById(
			this.testModel.id,
			this.expectedOp
		);
		delete this.testModel.attributes.object.y;
	}
}

module.exports = ApplyUnsetSubObjectToDatabaseTest;
