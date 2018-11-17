'use strict';

const UpdateTest = require('./update_test');

class ApplySetByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying a set operation to a document';
	}

	async updateDocument () {
		// do an update with a $set operation, verify that it took
		const update = {
			text: 'replaced!',
			number: 123
		};
		this.expectedOp = {
			'$set': update
		};
		this.actualOp = await this.data.test.applyOpById(
			this.testDocument.id,
			this.expectedOp
		);
		Object.assign(this.testDocument, update);
	}
}

module.exports = ApplySetByIdTest;
