'use strict';

const UpdateToCacheTest = require('./update_to_cache_test');

class ApplyPushToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying a push update to a cached model';
	}

	async updateTestModel () {
		// push this element to the array, and check that it's there
		const update = {
			array: 7
		};
		this.expectedOp = {
			'$push': update
		};

		this.actualOp = await this.data.test.applyOpById(
			this.testModel.id,
			this.expectedOp
		);
		this.testModel.attributes.array.push(7);
	}
}

module.exports = ApplyPushToCacheTest;
