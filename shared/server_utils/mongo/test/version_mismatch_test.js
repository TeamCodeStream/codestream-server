'use strict';

const UpdateTest = require('./update_test');

class VersionMismatchTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document with proper version directive after applying a set operation to a document and providing a version, and the version needs to be updated';
	}

	async doInterimUpdate () {
		await this.data.test.applyOpById(
			this.testDocument.id,
			{ $set: { text: 'interim!' } },
			{ version: 1}
		);
	}

	async updateDocument () {
		// before the test update, do an interim update to bump the version
		await this.doInterimUpdate();
		
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
		this.expectedOp.$set.version = 3;
		this.expectedOp.$version = {
			before: 2,
			after: 3
		};
		this.expectedVersion = 3;
		Object.assign(this.testDocument, update);
	}
}

module.exports = VersionMismatchTest;
