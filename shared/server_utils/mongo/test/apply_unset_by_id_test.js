'use strict';

const UpdateTest = require('./update_test');

class ApplyUnsetByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying an unset operation to a document';
	}

	async updateDocument () {
		// unset (delete an attribute), verify that it took
		const update = {
			text: 1,
		};
		this.expectedOp = {
			'$unset': update
		};
		this.actualOp = await this.data.test.applyOpById(
			this.testDocument.id,
			this.expectedOp
		);
		delete this.testDocument.text;
	}
}

module.exports = ApplyUnsetByIdTest;
