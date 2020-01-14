'use strict';

const UpdateToCacheTest = require('./update_to_cache_test');

class ApplyUnsetSubObjectToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying a sub-object unset to a cached model';
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

module.exports = ApplyUnsetSubObjectToCacheTest;
