'use strict';

var UpdateToCacheTest = require('./update_to_cache_test');

class ApplyAddArrayToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying an add array update to a cached model';
	}

	updateTestModel (callback) {
		const update = {
			array: [5, 7, 8]
		};
		this.data.test.applyOpById(
			this.testModel.id,
			{ '$addToSet': update },
			(error) => {
				if (error) { return callback(error); }
				this.testModel.attributes.array.push(7);
				this.testModel.attributes.array.push(8);
				callback();
			}
		);
	}
}

module.exports = ApplyAddArrayToCacheTest;
