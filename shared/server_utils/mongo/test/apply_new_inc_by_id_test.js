'use strict';

var UpdateTest = require('./update_test');

class ApplyNewIncByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying an increment operation to a document when the field does not yet exist';
	}

	async updateDocument () {
		// do an increment on a field which doesn't exist, should act like the field was 0 and create it
		// with the increment applied
		const update = {
			newNumber: 5
		};
		await this.data.test.applyOpById(
			this.testDocument._id,
			{ '$inc': update }
		);
		this.testDocument.newNumber = 5;
	}
}

module.exports = ApplyNewIncByIdTest;
