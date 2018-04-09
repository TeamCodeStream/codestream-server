'use strict';

var UpdateToCacheTest = require('./update_to_cache_test');

class ApplySetToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying a set update to a cached model';
	}

	async updateTestModel (callback) {
		// set some values and verify they are set
		const set = {
			text: 'replaced!',
			number: 123
		};
		try {
			await this.data.test.applyOpById(
				this.testModel.id,
				{ '$set': set }
			);
		}
		catch (error) {
			return callback(error);
		}
		Object.assign(this.testModel.attributes, set);
		callback();
	}
}

module.exports = ApplySetToCacheTest;
