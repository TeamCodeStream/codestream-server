'use strict';

const UpdateToCacheTest = require('./update_to_cache_test');

class ApplyNoAddToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get an unchanged model after applying a no-op add update to a cached model';
	}

	async updateTestModel () {
		// this element is already in the array, so check that the document is not changed at all by this op
		const update = {
			array: 4
		};
		this.expectedOp = {
			'$addToSet': update
		};

		this.actualOp = await this.data.test.applyOpById(
			this.testModel.id,
			this.expectedOp
		);
	}
}

module.exports = ApplyNoAddToCacheTest;
