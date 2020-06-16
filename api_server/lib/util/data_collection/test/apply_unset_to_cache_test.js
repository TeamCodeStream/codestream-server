'use strict';

const UpdateToCacheTest = require('./update_to_cache_test');

class ApplyUnsetToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying an unset update to a cached model';
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

module.exports = ApplyUnsetToCacheTest;
