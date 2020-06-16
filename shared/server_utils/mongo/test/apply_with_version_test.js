'use strict';

const UpdateTest = require('./update_test');

class ApplyWithVersionTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document with proper version directive after applying a set operation to a document and providing a version';
	}

	async updateDocument () {
		// do an update with a $set operation, verify that it took,
		// and verify version information is correct
		const update = {
			text: 'replaced!',
			number: 123
		};
		this.expectedOp = {
			'$set': update
		};
		this.actualOp = await this.data.test.applyOpById(
			this.testDocument.id,
			this.expectedOp,
			{ version: 1 }
		);
		this.expectedOp.$set.version = 2;
		this.expectedOp.$version = {
			before: 1,
			after: 2
		};
		this.expectedVersion = 2;
		Object.assign(this.testDocument, update);
	}
}

module.exports = ApplyWithVersionTest;
