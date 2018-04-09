'use strict';

var UpdateToCacheTest = require('./update_to_cache_test');

class ApplyUnsetSubObjectToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying a sub-object unset to a cached model';
	}

	async updateTestModel (callback) {
		// selectively unset some values in the object, and verify they are unset
		const unset = {
			'object.y': true
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
		delete this.testModel.attributes.object.y;
		callback();
	}
}

module.exports = ApplyUnsetSubObjectToCacheTest;
