'use strict';

var UpdateToCacheTest = require('./update_to_cache_test');

class ApplyNoAddToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get an unchanged model after applying a no-op add update to a cached model';
	}

	async updateTestModel (callback) {
		// this element is already in the array, so check that the document is not changed at all by this op
		const update = {
			array: 4
		};
		try {
			await this.data.test.applyOpById(
				this.testModel.id,
				{ '$addToSet': update }
			);
		}
		catch (error) {
			return callback(error);
		}
		callback();
	}
}

module.exports = ApplyNoAddToCacheTest;
