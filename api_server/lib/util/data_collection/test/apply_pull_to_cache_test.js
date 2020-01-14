'use strict';

const UpdateToCacheTest = require('./update_to_cache_test');

class ApplyPullToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying a pull update to a cached model';
	}

	async updateTestModel () {
		// pull this element from the array, and check that it's gone
		const update = {
			array: 4
		};
		this.expectedOp = {
			'$pull': update
		};

		this.actualOp = await this.data.test.applyOpById(
			this.testModel.id,
			this.expectedOp
		);
		const index = this.testModel.attributes.array.indexOf(4);
		this.testModel.attributes.array.splice(index, 1);
	}
}

module.exports = ApplyPullToCacheTest;
