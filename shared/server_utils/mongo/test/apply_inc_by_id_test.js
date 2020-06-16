'use strict';

const UpdateTest = require('./update_test');

class ApplyIncByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying an increment operation to a document';
	}

	async updateDocument () {
		// increment a numeric field, make sure it gets incremented
		const update = {
			number: 5
		};
		this.expectedOp = {
			'$inc': update
		};
		this.actualOp = await this.data.test.applyOpById(
			this.testDocument.id,
			this.expectedOp
		);
		this.testDocument.number += 5;
	}
}

module.exports = ApplyIncByIdTest;
