'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyAddToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying an add update and persisting';
	}

	updateTestModel (callback) {
		const update = {
			array: 7
		};
		this.data.test.applyOpById(
			this.testModel.id,
			{ add: update },
			(error) => {
				if (error) { return callback(error); }
				this.testModel.attributes.array.push(7);
				callback();
			}
		);
	}
}

module.exports = ApplyAddToDatabaseTest;
