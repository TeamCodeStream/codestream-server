'use strict';

var UpdateToCacheTest = require('./update_to_cache_test');

class ApplyNoAddToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get an unchanged model after applying a no-op add update to a cached model';
	}

	updateTestModel (callback) {
		const update = {
			array: 4
		};
		this.data.test.applyOpById(
			this.testModel.id,
			{ '$addToSet': update },
			callback
		);
	}
}

module.exports = ApplyNoAddToCacheTest;
