'use strict';

var UpdateTest = require('./update_test');

class ApplyAddByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying an add operation to a document';
	}

	async updateDocument () {
		// add an element to the array, make sure it gets added
		const update = {
			array: 7
		};
		await this.data.test.applyOpById(
			this.testDocument._id,
			{ '$addToSet': update }
		);
		this.testDocument.array.push(7);
	}
}

module.exports = ApplyAddByIdTest;
