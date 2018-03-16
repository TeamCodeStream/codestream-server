'use strict';

var UpdateTest = require('./update_test');

class ApplyPushByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying a push operation to a document';
	}

	async updateDocument () {
		// push an element onto an array, verify it was pushed
		const update = {
			array: 7
		};
		await this.data.test.applyOpById(
			this.testDocument._id,
			{ '$push': update }
		);
		this.testDocument.array.push(7);
	}
}

module.exports = ApplyPushByIdTest;
