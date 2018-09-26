'use strict';

var UpdateToCacheTest = require('./update_to_cache_test');

class ApplyUnsetToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying an unset update to a cached model';
	}

	async updateTestModel (callback) {
		// unset a value and verify it is unset
		const unset = {
			text: 1,
		};
		this.expectedOp = {
			'$unset': unset
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
		delete this.testModel.attributes.text;
		callback();
	}
}

module.exports = ApplyUnsetToCacheTest;
