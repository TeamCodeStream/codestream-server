'use strict';

const UpdateTest = require('./update_test');

class ApplyPushByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying a push operation to a document';
	}

	async updateDocument () {
		// push an element onto an array, verify it was pushed
		const update = {
			array: 7
		};
		this.expectedOp = {
			'$push': update
		};
		this.actualOp = await this.data.test.applyOpById(
			this.testDocument.id,
			this.expectedOp
		);
		this.testDocument.array.push(7);
	}
}

module.exports = ApplyPushByIdTest;
