'use strict';

var UpdateToCacheTest = require('./update_to_cache_test');

class ApplySetSubObjectToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying a sub-object set to a cached model';
	}

	updateTestModel (callback) {
		const set = {
			'object.x': 'replaced!',
			'object.z': 3
		};
		this.data.test.applyOpById(
			this.testModel.id,
			{ '$set': set },
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.testModel.attributes.object, { x: 'replaced!', z: 3 });
				callback();
			}
		);
	}
}

module.exports = ApplySetSubObjectToCacheTest;
