'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyAddArrayToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying an add array update and persisting';
	}

	async updateTestModel (callback) {
		// add these elements to the array, some of which are already in it,
		// make sure the 7 and 8 are added, but not the 5, since it's already there
		const update = {
			array: [5, 7, 8]
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
		this.testModel.attributes.array.push(8);
		callback();
	}
}

module.exports = ApplyAddArrayToDatabaseTest;
