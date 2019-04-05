'use strict';

var UpdateToCacheTest = require('./update_to_cache_test');

class ApplyNoAddToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get an unchanged model after applying a no-op add update to a cached model';
	}

	updateTestModel (callback) {
		// this element is already in the array, so check that the document is not changed at all by this op
		const update = {
			array: 4
		};
		this.expectedOp = {
			'$addToSet': update
		};

		(async () => {
			try {
				this.actualOp = await this.data.test.applyOpById(
					this.testModel.id,
					this.expectedOp
				);
			}
			catch (error) {
				return callback(error);
			}
			callback();
		})();
	}
}

module.exports = ApplyNoAddToCacheTest;
