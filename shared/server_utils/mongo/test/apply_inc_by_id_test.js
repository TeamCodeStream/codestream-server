'use strict';

var UpdateTest = require('./update_test');

class ApplyIncByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying an increment operation to a document';
	}

	async updateDocument () {
		// increment a numeric field, make sure it gets incremented
		const update = {
			number: 5
		};
		await this.data.test.applyOpById(
			this.testDocument._id,
			{ '$inc': update }
		);
		this.testDocument.number += 5;
	}
}

module.exports = ApplyIncByIdTest;
