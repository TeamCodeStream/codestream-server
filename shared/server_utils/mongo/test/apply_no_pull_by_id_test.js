'use strict';

const UpdateTest = require('./update_test');

class ApplyNoPullByIdTest extends UpdateTest {

	get description () {
		return 'should get an unchanged document after applying a no-op pull operation to a document';
	}

	async updateDocument () {
		// try to pull an element from an array that is not in the array, the document should be unchanged
		const update = {
			array: 8
		};
		this.expectedOp = {
			'$pull': update
		};
		this.actualOp = await this.data.test.applyOpById(
			this.testDocument.id,
			this.expectedOp
		);
	}
}

module.exports = ApplyNoPullByIdTest;
