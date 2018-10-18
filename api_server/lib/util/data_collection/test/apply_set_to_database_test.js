'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplySetToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying a set update and persisting';
	}

	async updateTestModel (callback) {
		// set some values and verify they are set
		const set = {
			text: 'replaced!',
			number: 123
		};
		this.expectedOp = {
			'$set': set
		};
		try {
			this.actualOp = await this.data.test.applyOpById(
				this.testModel.id,
				this.expectedOp
			);
		}
		catch (error) {
			return callback(error);
		}
		Object.assign(this.testModel.attributes, set);
		callback();
	}
}

module.exports = ApplySetToDatabaseTest;
