'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyIncToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying an increment update and persisting';
	}

	updateTestModel (callback) {
		// increment a numeric field, make sure it gets incremented
		const update = {
			number: 5
		};
		this.expectedOp = {
			'$inc': update
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
			this.testModel.attributes.number += 5;
			callback();
		})();
	}
}

module.exports = ApplyIncToDatabaseTest;
