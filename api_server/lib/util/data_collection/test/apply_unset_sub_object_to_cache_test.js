'use strict';

var UpdateToCacheTest = require('./update_to_cache_test');

class ApplyUnsetSubObjectToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying a sub-object unset to a cached model';
	}

	updateTestModel (callback) {
		// selectively unset some values in the object, and verify they are unset
		const unset = {
			'object.y': true
		};
		this.expectedOp = {
			'$unset': unset
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
			delete this.testModel.attributes.object.y;
			callback();
		})();
	}
}

module.exports = ApplyUnsetSubObjectToCacheTest;
