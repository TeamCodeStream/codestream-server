'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyNoAddToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get an unchanged model after applying a no-op add update and persisting';
	}

	updateTestModel (callback) {
		// this element is already in the array, so check that the document is not changed at all by this op
		const update = {
			array: 4
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
			callback();
		})();
	}
}

module.exports = ApplyNoAddToDatabaseTest;
