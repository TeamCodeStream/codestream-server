'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplySetSubObjectToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying a sub-object set to a model and persisting';
	}

	updateTestModel (callback) {
		// selectively set some values in the object, and verify they are set
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

module.exports = ApplySetSubObjectToDatabaseTest;
