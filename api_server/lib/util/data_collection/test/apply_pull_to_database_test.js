'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyPullToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying a pull update and persisting';
	}

	updateTestModel (callback) {
		const update = {
			array: 4
		};
		this.data.test.applyOpById(
			this.testModel.id,
			{ pull: update },
			(error) => {
				if (error) { return callback(error); }
				let index = this.testModel.attributes.array.indexOf(4);
				this.testModel.attributes.array.splice(index, 1);
				callback();
			}
		);
	}
}

module.exports = ApplyPullToDatabaseTest;
