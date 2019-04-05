'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyAddToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying an add update and persisting';
	}

	updateTestModel (callback) {
		// add an element to the array, make sure it gets added
		const update = {
			array: 7
		};
		this.expectedOp = {
			'$addToSet': update
		};

		(async () => {
			try {
				this.actualOp = await this.data.test.applyOpById(
					this.testModel.id,
					this.expectedOp
				);
			}
			catch (error) {
				return callback(error);
			}
			this.testModel.attributes.array.push(7);
			callback();
		})();
	}
}

module.exports = ApplyAddToDatabaseTest;
