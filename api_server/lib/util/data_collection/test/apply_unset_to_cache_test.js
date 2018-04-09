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
		try {
			await this.data.test.applyOpById(
				this.testModel.id,
				{ '$unset': unset }
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
