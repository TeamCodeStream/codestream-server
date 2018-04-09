'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyAddToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying an add update and persisting';
	}

	async updateTestModel (callback) {
		// add an element to the array, make sure it gets added
		const update = {
			array: 7
		};
		try {
			await this.data.test.applyOpById(
				this.testModel.id,
				{ '$addToSet': update }
			);
		}
		catch (error) {
			return callback(error);
		}
		this.testModel.attributes.array.push(7);
		callback();
	}
}

module.exports = ApplyAddToDatabaseTest;
