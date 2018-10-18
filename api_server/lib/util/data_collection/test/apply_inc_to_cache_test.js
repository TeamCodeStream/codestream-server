'use strict';

var UpdateToCacheTest = require('./update_to_cache_test');

class ApplyIncToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying an increment update to a cached model';
	}

	async updateTestModel (callback) {
		// increment a numeric field, make sure it gets incremented
		const update = {
			number: 5
		};
		this.expectedOp = {
			'$inc': update
		};
		try {
			this.actualOp = await this.data.test.applyOpById(
				this.testModel.id,
				this.expectedOp
			);
		}
		catch (error) {
			return callback(error);
		}
		this.testModel.attributes.number += 5;
		callback();
	}
}

module.exports = ApplyIncToCacheTest;
