'use strict';

var UpdateToCacheTest = require('./update_to_cache_test');

class ApplySetToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying a set update to a cached model';
	}

	updateTestModel (callback) {
		// set some values and verify they are set
		const set = {
			text: 'replaced!',
			number: 123
		};
		this.expectedOp = {
			'$set': set
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
			Object.assign(this.testModel.attributes, set);
			callback();
		})();
	}
}

module.exports = ApplySetToCacheTest;
