'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplySetToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying a set update and persisting';
	}

	updateTestModel (callback) {
		const set = {
			text: 'replaced!',
			number: 123
		};
		this.data.test.applyOpById(
			this.testModel.id,
			{ '$set': set },
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.testModel.attributes, set);
				callback();
			}
		);
	}
}

module.exports = ApplySetToDatabaseTest;
