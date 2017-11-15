'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyPushToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying a push update and persisting';
	}

	updateTestModel (callback) {
		const update = {
			array: 7
		};
		this.data.test.applyOpById(
			this.testModel.id,
			{ push: update },
			(error) => {
				if (error) { return callback(error); }
				this.testModel.attributes.array.push(7);
				callback();
			}
		);
	}
}

module.exports = ApplyPushToDatabaseTest;
