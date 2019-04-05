'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyPushToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying a push update and persisting';
	}

	updateTestModel (callback) {
		// push this element to the array, and check that it's there
		const update = {
			array: 7
		};
		this.expectedOp = {
			'$push': update
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

module.exports = ApplyPushToDatabaseTest;
