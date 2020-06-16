'use strict';

const UpdateToDatabaseTest = require('./update_to_database_test');

class ApplySetSubObjectToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying a sub-object set to a model and persisting';
	}

	async updateTestModel () {
		// selectively set some values in the object, and verify they are set
		const set = {
			'object.x': 'replaced!',
			'object.z': 3
		};
		this.expectedOp = {
			'$set': set
		};

		this.actualOp = await this.data.test.applyOpById(
			this.testModel.id,
			this.expectedOp
		);
		Object.assign(this.testModel.attributes.object, { x: 'replaced!', z: 3 });
	}
}

module.exports = ApplySetSubObjectToDatabaseTest;
