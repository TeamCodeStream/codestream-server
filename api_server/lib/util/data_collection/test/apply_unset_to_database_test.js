'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyUnsetToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying an unset update and persisting';
	}

	updateTestModel (callback) {
		// unset a value and verify it is unset
		const unset = {
			text: 1,
		};
		this.data.test.applyOpById(
			this.testModel.id,
			{ '$unset': unset },
			(error) => {
				if (error) { return callback(error); }
				delete this.testModel.attributes.text;
				callback();
			}
		);
	}
}

module.exports = ApplyUnsetToDatabaseTest;
