'use strict';

var UpdateToCacheTest = require('./update_to_cache_test');

class ApplyUnsetToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying an unset update to a cached model';
	}

	updateTestModel (callback) {
		const unset = {
			text: 1,
		};
		this.data.test.applyOpById(
			this.testModel.id,
			{ unset: unset },
			(error) => {
				if (error) { return callback(error); }
				delete this.testModel.attributes.text;
				callback();
			}
		);
	}
}

module.exports = ApplyUnsetToCacheTest;
