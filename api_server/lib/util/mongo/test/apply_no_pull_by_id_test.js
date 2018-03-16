'use strict';

var UpdateTest = require('./update_test');

class ApplyNoPullByIdTest extends UpdateTest {

	get description () {
		return 'should get an unchanged document after applying a no-op pull operation to a document';
	}

	async updateDocument () {
		// try to pull an element from an array that is not in the array, the document should be unchanged
		const update = {
			array: 8
		};
		await this.data.test.applyOpById(
			this.testDocument._id,
			{ '$pull': update }
		);
	}
}

module.exports = ApplyNoPullByIdTest;
