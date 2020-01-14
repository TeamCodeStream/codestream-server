'use strict';

const UpdateToCacheTest = require('./update_to_cache_test');

class ApplyAddArrayToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying an add array update to a cached model';
	}

	async updateTestModel () {
		// add these elements to the array, some of which are already in it,
		// make sure the 7 and 8 are added, but not the 5, since it's already there
		const update = {
			array: [5, 7, 8]
		};
		this.expectedOp = {
			'$addToSet': update
		};

		this.actualOp = await this.data.test.applyOpById(
			this.testModel.id,
			this.expectedOp,
		);
		this.testModel.attributes.array.push(7);
		this.testModel.attributes.array.push(8);
	}
}

module.exports = ApplyAddArrayToCacheTest;
