'use strict';

const UpdateTest = require('./update_test');

class ApplyAddByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying an add operation to a document';
	}

	async updateDocument () {
		// add an element to the array, make sure it gets added
		const update = {
			array: 7
		};
		this.expectedOp = {
			'$addToSet': update
		};
		this.actualOp = await this.data.test.applyOpById(
			this.testDocument.id,
			this.expectedOp
		);
		this.testDocument.array.push(7);
	}
}

module.exports = ApplyAddByIdTest;
