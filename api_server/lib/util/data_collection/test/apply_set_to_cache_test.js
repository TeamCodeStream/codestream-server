'use strict';

var UpdateToCacheTest = require('./update_to_cache_test');

class ApplySetToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying a set update to a cached model';
	}

	updateTestModel (callback) {
		const set = {
			text: 'replaced!',
			number: 123
		};
		this.data.test.applyOpById(
			this.testModel.id,
			{ '$set': set },
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.testModel.attributes, set);
				callback();
			}
		);
	}
}

module.exports = ApplySetToCacheTest;
