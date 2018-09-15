'use strict';

var UpdateTest = require('./update_test');

class ApplyPullByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying a pull operation to a document';
	}

	async updateDocument () {
		// pull an element from the array, verify that it was pulled
		const update = {
			array: 4
		};
		await this.data.test.applyOpById(
			this.testDocument._id,
			{ '$pull': update }
		);
		const index = this.testDocument.array.indexOf(4);
		this.testDocument.array.splice(index, 1);
	}
}

module.exports = ApplyPullByIdTest;
