'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyUnsetSubObjectToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying a sub-object unset to a model and persisting';
	}

	updateTestModel (callback) {
		const unset = {
			'object.y': true
		};
		this.data.test.applyOpById(
			this.testModel.id,
			{ unset: unset },
			(error) => {
				if (error) { return callback(error); }
				delete this.testModel.attributes.object.y;
				callback();
			}
		);
	}
}

module.exports = ApplyUnsetSubObjectToDatabaseTest;
